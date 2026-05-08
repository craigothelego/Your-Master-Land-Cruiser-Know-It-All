/**
 * Your Master Land Cruiser Know-It-All
 *
 * A single Express service that:
 *   1. Serves the static frontend in ./public
 *   2. Exposes /api/vin/:vin    -> NHTSA vPIC decode + Land Cruiser series mapper
 *   3. Exposes /api/troubleshoot -> LLM-backed diagnostic helper
 *   4. Exposes /api/resources    -> filtered curated resources
 *   5. Exposes /api/series       -> the full series catalog (used by the UI)
 */

require('dotenv').config();

const express = require('express');
const path = require('path');

const { SERIES, identifySeries } = require('./data/landcruiser-series');
const {
  RESOURCES,
  RESOURCE_TYPES,
  SYSTEMS,
  filterResources,
  ih8mudSearchUrl,
} = require('./data/repair-resources');

const app = express();
const PORT = process.env.PORT || 3000;

// The image endpoint accepts base64-encoded photos and needs a much larger
// body-size limit; it must be registered BEFORE the small global parser so it
// matches first. The global parser then short-circuits because req.body is
// already populated.
app.use('/api/vin/from-image', express.json({ limit: '8mb' }));
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// VIN decode
// ---------------------------------------------------------------------------

/**
 * Validate a VIN. Modern (1981+) VINs are exactly 17 characters and exclude
 * I, O, Q. Older VINs are shorter and chassis-style; we accept them but flag.
 */
function classifyVin(vin) {
  const v = (vin || '').trim().toUpperCase();
  if (!v) return { ok: false, reason: 'empty' };
  if (/[IOQ]/.test(v) && v.length === 17) {
    return { ok: false, reason: 'invalid-chars', vin: v };
  }
  if (v.length === 17) return { ok: true, vin: v, modern: true };
  if (v.length >= 8 && v.length <= 16) return { ok: true, vin: v, modern: false };
  return { ok: false, reason: 'bad-length', vin: v };
}

/**
 * Pull the most relevant fields out of NHTSA's vPIC "Results" array.
 */
function extractNhtsaFields(results) {
  const wanted = {
    Make: 'make',
    Model: 'model',
    'Model Year': 'year',
    'Vehicle Type': 'vehicleType',
    'Body Class': 'bodyClass',
    'Engine Number of Cylinders': 'engineCylinders',
    'Displacement (L)': 'displacementL',
    'Engine Configuration': 'engineConfig',
    'Fuel Type - Primary': 'fuelType',
    'Engine Model': 'engineModel',
    'Transmission Style': 'transmissionStyle',
    'Transmission Speeds': 'transmissionSpeeds',
    'Drive Type': 'driveType',
    'Plant Country': 'plantCountry',
    'Plant City': 'plantCity',
    'Trim': 'trim',
    'Series': 'nhtsaSeries',
    'Error Code': 'errorCode',
    'Error Text': 'errorText',
  };
  const out = {};
  for (const row of results || []) {
    const key = wanted[row.Variable];
    if (!key) continue;
    if (row.Value && row.Value !== 'Not Applicable' && row.Value !== 'null') {
      out[key] = row.Value;
    }
  }
  return out;
}

app.get('/api/vin/:vin', async (req, res) => {
  const cls = classifyVin(req.params.vin);
  if (!cls.ok) {
    return res.status(400).json({ error: 'Invalid VIN', detail: cls.reason });
  }

  // Pre-1981 short VIN: NHTSA can't decode these. Try our local series mapper
  // against the bare VIN and return what we can.
  if (!cls.modern) {
    const guess = identifySeries({ year: '', make: 'Toyota', model: 'Land Cruiser' }, cls.vin);
    return res.json({
      vin: cls.vin,
      preModernVin: true,
      message:
        'Pre-1981 Land Cruisers used short chassis-style VINs that the NHTSA database cannot decode. ' +
        'Use the Resources tab and the chassis prefix (e.g. FJ40, FJ55) to find the right manuals.',
      series: guess,
    });
  }

  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(
      cls.vin,
    )}?format=json`;
    const r = await fetch(url, { headers: { 'User-Agent': 'land-cruiser-know-it-all/0.1' } });
    if (!r.ok) {
      return res.status(502).json({ error: 'NHTSA upstream error', status: r.status });
    }
    const data = await r.json();
    const fields = extractNhtsaFields(data.Results);
    const make = (fields.make || '').toLowerCase();
    const isToyotaFamily = /toyota|lexus/.test(make);

    const series = isToyotaFamily ? identifySeries(fields, cls.vin) : null;

    // NHTSA's database is US-centric. RoW VINs sometimes come back with sparse
    // model/year fields. If decoding gave us very little but the VIN clearly
    // starts with a Toyota WMI (J*, 6T*, MR0, etc.), suggest using the chassis
    // code prefix manually via the Resources tab.
    const sparse = !fields.year || !fields.model;

    return res.json({
      vin: cls.vin,
      decoded: fields,
      isLandCruiserFamily: Boolean(series),
      series,
      sparseRoW: sparse && !series,
      warning: !isToyotaFamily
        ? 'This VIN does not appear to be a Toyota or Lexus. Decoder still ran, but series detection was skipped.'
        : sparse && !series
        ? 'NHTSA returned limited info for this VIN (their database is US-focused). For non-US-market trucks, use the chassis prefix from the VIN (e.g. KDJ120, GRJ150, VDJ79) on the Resources tab.'
        : !series
        ? 'Decoded as Toyota/Lexus, but did not match a Land Cruiser generation. Double-check the VIN, or it may be a non-Land-Cruiser Toyota/Lexus.'
        : undefined,
    });
  } catch (err) {
    console.error('[vin] decode failed:', err);
    return res.status(500).json({ error: 'VIN decode failed', detail: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// VIN / vehicle identification from an uploaded image (Claude vision)
// ---------------------------------------------------------------------------

const VISION_SYSTEM_PROMPT = `You are a Toyota Land Cruiser identification specialist looking at a single user-uploaded photo. Your job is exactly one of these three:

1. The photo shows a VIN somewhere (VIN plate, door jamb sticker, dashboard, registration document, title, insurance card, etc.). Extract the EXACT 17-character VIN. VINs are A-Z (excluding I, O, Q) and 0-9. Older pre-1981 trucks may have shorter chassis-style numbers - those are still valid here.

2. The photo shows a Land Cruiser (or Lexus LX/GX based on Land Cruiser) but NOT a readable VIN. Identify the generation/series visually using cues like grille, headlights, body shape, wheel design, badging, era of styling.

3. The photo shows neither a VIN nor a Land Cruiser. Politely say so.

Respond with STRICT JSON, no code fences, no commentary:

{
  "kind": "vin" | "vehicle" | "neither",
  "vin": string | null,
  "vinConfidence": "high" | "medium" | "low" | null,
  "identification": {
    "series": "40-series"|"55-series"|"60-series"|"70-series"|"80-series"|"100-series"|"200-series"|"300-series"|"j250"|"prado-j90"|"prado-j120"|"prado-j150"|"lx450"|"lx470"|"lx570"|"lx600"|"unknown",
    "confidence": "high" | "medium" | "low",
    "reasoning": string,
    "yearRange": [number, number] | null
  } | null,
  "notes": string
}

Rules:
- If a VIN is readable, prefer that path. Be EXACT - do NOT guess unclear characters; mark vinConfidence "low" and call out the unclear positions in notes.
- For visual identification, if a Lexus LX is shown, identify it (lx450/lx470/lx570/lx600), not the underlying Land Cruiser series.
- If you genuinely can't tell which Prado generation, prefer "unknown" with low confidence rather than guessing.
- Output JSON ONLY.`;

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

app.post('/api/vin/from-image', async (req, res) => {
  const { imageBase64, mimeType } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Missing imageBase64 in request body.' });
  }
  if (!ALLOWED_IMAGE_MIME.includes(mimeType)) {
    return res.status(400).json({
      error: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.',
      received: mimeType,
    });
  }
  // Loose sanity-check on base64 size (8MB raw -> ~10.7MB encoded; we capped
  // request body at 8MB; client should resize before upload).
  if (imageBase64.length > 11 * 1024 * 1024) {
    return res.status(413).json({ error: 'Image too large. Resize to under ~6MB and retry.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Image identification is not configured on this server (ANTHROPIC_API_KEY is missing).',
      hint: 'Set ANTHROPIC_API_KEY in your Render service environment variables.',
    });
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: 0,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: imageBase64 },
              },
              { type: 'text', text: 'Identify this image per the system instructions.' },
            ],
          },
          // Prefill assistant turn with `{` to force JSON output.
          { role: 'assistant', content: '{' },
        ],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('[vin/from-image] Anthropic error', r.status, text);
      return res.status(502).json({ error: 'AI provider error', status: r.status });
    }

    const data = await r.json();
    const rawContent = data.content?.[0]?.text || '';
    const content = '{' + rawContent;
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (_e) {
      return res.status(502).json({ error: 'AI returned non-JSON response', raw: content });
    }

    // If we got a VIN, also run it through our standard decoder so the client
    // gets a complete payload in one round trip (when possible).
    let decode = null;
    if (parsed.kind === 'vin' && typeof parsed.vin === 'string') {
      const vin = parsed.vin.trim().toUpperCase();
      const cls = classifyVin(vin);
      if (cls.ok && cls.modern) {
        try {
          const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`;
          const nr = await fetch(url, { headers: { 'User-Agent': 'land-cruiser-know-it-all/0.1' } });
          if (nr.ok) {
            const nd = await nr.json();
            const fields = extractNhtsaFields(nd.Results);
            const series = identifySeries(fields, vin);
            decode = { decoded: fields, series, isLandCruiserFamily: Boolean(series) };
          }
        } catch (_e) {
          // Decode is best-effort; ignore failures here, the client can retry.
        }
      }
      parsed.vin = vin;
    }

    return res.json({ result: parsed, decode });
  } catch (err) {
    console.error('[vin/from-image] failed:', err);
    return res
      .status(500)
      .json({ error: 'Image identification failed', detail: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

app.get('/api/series', (_req, res) => {
  res.json({
    series: SERIES.map((s) => ({
      id: s.id,
      label: s.label,
      chassisCodes: s.chassisCodes,
      yearRange: s.yearRange,
      blurb: s.blurb,
    })),
    systems: SYSTEMS,
    resourceTypes: RESOURCE_TYPES,
  });
});

app.get('/api/resources', (req, res) => {
  const { seriesId, system, type, q } = req.query;
  let list = filterResources({ seriesId, system, type });
  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        (r.notes || '').toLowerCase().includes(needle),
    );
  }
  const ih8mudSearch = seriesId && q ? ih8mudSearchUrl(String(seriesId), String(q)) : null;
  res.json({ resources: list, ih8mudSearch });
});

// ---------------------------------------------------------------------------
// AI troubleshoot
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert Toyota Land Cruiser mechanic with deep knowledge of the GLOBAL Land Cruiser lineup, not just US-market vehicles. You are a longtime ih8mud / AULRO / lcool forum contributor.

You diagnose problems on the entire Land Cruiser family AND its Lexus siblings (LX 450/470/570/600, GX 470/460):
- Heavy-duty wagons: 40, 55, 60, 80, 100, 200, 300 series
- Light-duty / Prado: J70 Light, J90, J120, J150, J250 (sold as "Land Cruiser" in North America from 2024, "Land Cruiser Prado" or "Land Cruiser 250" elsewhere)
- 70 Series workhorses: HZJ75/76/78/79, VDJ76/78/79, GRJ76/79 (Australia, Africa, Middle East, Latin America, Japan)

You handle BOTH gasoline AND diesel engines. Be ready to diagnose:
- Petrol: F, 2F, 3F-E, 1FZ-FE, 5VZ-FE, 2UZ-FE, 1GR-FE, 3UR-FE, V35A-FTS, T24A-FTS
- Diesel: B/3B, H/2H/12H-T, 1HZ, 1HD-T / 1HD-FT / 1HD-FTE, 1KZ-TE, 1KD-FTV, 1VD-FTV (single and twin-turbo), 1GD-FTV, F33A-FTV
- Diesel-specific systems: injectors, common-rail, EGR, DPF/regen, glow plugs, intake "carbon mountain", PHH (#6 cylinder coolant pipe on 1HZ/1HD), head cracks (1KZ-TE), turbo wastegate / VNT actuators

Do NOT assume the user is in the US. Land Cruiser owners in Australia, the UK/EU, the Middle East, Africa, Japan, and Latin America have different model availability, fuel quality, climate (dust/heat/cold), and parts ecosystems. When relevant, mention regional considerations (e.g., DPF requirements in Australia/EU, fuel sulfur differences, cold-start considerations in northern climates).

If a user describes a non-Land-Cruiser vehicle, politely refuse and explain.

Given the user's symptoms (and, if provided, their vehicle's series, chassis code, year, and engine), respond with STRICT JSON matching this schema, with no surrounding text or markdown:

{
  "summary": string,                       // one-paragraph framing of the most likely problem area
  "likelyCauses": [                        // ranked, most-likely first, max 5
    {
      "title": string,                     // short cause name, e.g. "Failing alternator"
      "explanation": string,               // 2-4 sentences in plain English
      "severity": "low" | "medium" | "high",
      "system": string,                    // one of: engine, cooling, fuel, electrical, drivetrain, transmission, transfer-case, axles, suspension, steering, brakes, body, interior, hvac, ahc, general
      "diagnosticSteps": string[],         // 2-6 concrete checks the owner or a shop should perform
      "estimatedCostUsd": { "low": number, "high": number } | null,
      "diyDifficulty": "easy" | "moderate" | "advanced" | "shop-only",
      "partsNeeded": [                     // 0-8 parts likely required to resolve this cause
        {
          "name": string,                  // common part name, e.g. "Thermostat (with gasket)"
          "notes": string,                 // why it's likely needed, OEM vs aftermarket guidance, or "diagnostic only"
          "searchTerms": string,           // good keywords for parts vendor search, e.g. "1FZ-FE thermostat 88C"
          "oem": boolean,                  // true if user should buy OEM specifically, false if aftermarket is acceptable
          "oemPartNumber": string | null,  // Toyota / Lexus OEM part number when you are confident it's correct for the user's specific year/series/engine. Use Toyota's hyphenated format (e.g., "16400-66060"). Null when unsure.
          "oemPartNumberConfidence": "high" | "medium" | "low" | null  // confidence in the OEM part number above. "high" = canonical, well-documented for this model+year. "medium" = correct for the engine/series family but may differ by sub-model or production date. "low" = best-guess. Null when oemPartNumber is null.
        }
      ]
    }
  ],
  "redFlags": string[],                    // safety / "stop driving" warnings, if any
  "searchKeywords": string[]               // 3-8 phrases the owner can paste into ih8mud search or Google
}

Rules:
- Be specific to the series/chassis/engine when given. Examples:
  - "1FZ-FE PHH (#6 coolant pipe)" for an 80 series petrol
  - "1HD-FTE injector seal weep" for an HDJ100 / HDJ80 diesel
  - "1KZ-TE head crack between intake ports" for a Prado J90
  - "1KD-FTV CSD (cold-start) and intake carbon" for a Prado J120 or J150 (pre-2015)
  - "1GD-FTV DPF regeneration / oil dilution" for a Prado J150 (2015+) or J250
  - "AHC accumulator / globe pressure" only for Lexus LX 470/570/600
  - "KDSS cross-link" only for Prado J120/J150, 200 series, and FJ Cruiser/4Runner/GX siblings
  - "1VD-FTV cracked exhaust manifold" for VDJ200 / VDJ79
- Provide OEM Toyota / Lexus part numbers when you are CONFIDENT they are correct for the user's specific year + series + engine. Use the canonical hyphenated Toyota format (e.g., "16400-66060", "90916-03075"). When in doubt about which sub-variant applies, mark oemPartNumberConfidence as "medium" or "low" and tell the user to verify by VIN. NEVER make up plausible-looking numbers - leave the field null instead.
- Always provide good searchTerms (engine code + part name + series) so even when the OEM number is unknown, vendor search returns useful results.
- For each part, set oem=true when factory quality matters (cooling system parts, sensors, gaskets, water pumps, head gaskets, AHC components, KDSS components, diesel injectors and seals, common-rail components) and oem=false when aftermarket is fine (brake pads, filters, belts, hoses where Gates/Aisin/Denso are common).
- estimatedCostUsd is in USD; remind users in your explanation that local labor rates and parts availability vary by region, especially for RoW-only diesel parts.
- If the cause is purely diagnostic (e.g., "loose ground"), partsNeeded can be an empty array or a single entry with notes "diagnostic only".
- If the symptom is too vague, say so in summary and ask for more detail in searchKeywords.
- Output JSON ONLY. No code fences, no commentary.
`;

/**
 * Curated parts-vendor list. Each entry knows how to build a search URL for
 * a given query. Where a vendor's internal search is unreliable or unknown,
 * we fall back to Google site-scoped search (always lands the user on real
 * indexed product pages from that vendor).
 */
const PARTS_VENDORS = [
  // OEM-focused
  { vendor: 'Olathe Toyota Parts (OEM)', kind: 'oem', site: 'olathetoyotaparts.com' },
  { vendor: 'PartSouq (OEM, international)', kind: 'oem', site: 'partsouq.com' },
  { vendor: 'Amayama (JDM OEM)', kind: 'oem', site: 'amayama.com' },
  // Enthusiast / aftermarket - heavy Land Cruiser specialty
  { vendor: 'Cruiser Corps', kind: 'aftermarket', site: 'cruisercorps.com' },
  { vendor: 'Cruiser Parts (CruiserParts.net)', kind: 'aftermarket', site: 'shop.cruiserparts.net' },
  { vendor: 'City Racer LLC', kind: 'aftermarket', site: 'cityracerllc.com' },
  { vendor: 'CruiserTeq', kind: 'aftermarket', site: 'cruiserteq.com' },
  { vendor: 'Cool Cruisers', kind: 'aftermarket', site: 'coolcruisers.com' },
  { vendor: 'Specter Off-Road (SOR)', kind: 'aftermarket', site: 'sor.com' },
  { vendor: 'Cruiser Outfitters', kind: 'aftermarket', site: 'cruiseroutfitters.com' },
  { vendor: "Beno's Cruisers", kind: 'aftermarket', site: 'benoscruisers.com' },
  { vendor: 'RockAuto', kind: 'aftermarket', site: 'rockauto.com' },
  // Marketplaces (last)
  { vendor: 'Amazon', kind: 'marketplace', direct: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
  { vendor: 'eBay Motors', kind: 'marketplace', direct: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&_sacat=6028` },
];

/**
 * Build a list of parts-vendor search URLs for a given part.
 *
 * Strategy:
 *  - When the LLM provided an OEM part number, USE IT as the primary query -
 *    vendors return high-precision results when searching by part number.
 *  - Otherwise, use the part's searchTerms (or name) plus the series label.
 *  - Use Google site-scoped search for vendor lookups (`site:vendor.com Q`)
 *    because every vendor's internal search has different conventions and
 *    Google reliably returns the right product pages.
 *
 * @param {{
 *   name: string,
 *   searchTerms?: string,
 *   oem?: boolean,
 *   oemPartNumber?: string | null,
 * }} part
 * @param {string} [seriesLabel]
 * @returns {Array<{ vendor: string, url: string, kind: 'oem'|'aftermarket'|'marketplace' }>}
 */
function buildPartsSearchUrls(part, seriesLabel /*, vin */) {
  const oemNum = (part.oemPartNumber || '').trim();
  const baseTerms = (part.searchTerms || part.name || '').trim();
  // When we have an OEM number it should be the dominant query term; vendors
  // return very precise results. We still include the part name as a safety
  // net so Google Shopping / generic results stay relevant.
  const query = oemNum
    ? `${oemNum} ${part.name || ''}`.trim()
    : `${seriesLabel || 'Toyota Land Cruiser'} ${baseTerms}`.trim();
  const encQ = encodeURIComponent(query);

  const links = PARTS_VENDORS.map((v) => {
    if (v.direct) return { vendor: v.vendor, kind: v.kind, url: v.direct(query) };
    // Google site-scoped search - always lands on the vendor's real product pages.
    return {
      vendor: v.vendor,
      kind: v.kind,
      url: `https://www.google.com/search?q=site%3A${v.site}+${encQ}`,
    };
  });

  // If the LLM marked this part as OEM-required, surface OEM vendors first.
  if (part.oem) {
    links.sort((a, b) => (a.kind === 'oem' ? -1 : 1) - (b.kind === 'oem' ? -1 : 1));
  }

  return links;
}

app.post('/api/troubleshoot', async (req, res) => {
  const { symptoms, vin, series, year, engine } = req.body || {};
  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 5) {
    return res.status(400).json({ error: 'Please describe the symptoms in at least a sentence.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI troubleshooting is not configured on this server (ANTHROPIC_API_KEY is missing).',
      hint: 'Set ANTHROPIC_API_KEY in your Render service environment variables.',
    });
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

  const contextLines = [];
  if (vin) contextLines.push(`VIN: ${vin}`);
  if (series) contextLines.push(`Series: ${series}`);
  if (year) contextLines.push(`Model year: ${year}`);
  if (engine) contextLines.push(`Engine: ${engine}`);
  const userMsg =
    (contextLines.length ? `Vehicle context:\n${contextLines.join('\n')}\n\n` : '') +
    `Symptoms:\n${symptoms.trim()}`;

  try {
    // Anthropic Messages API. We use the "assistant prefill" trick (starting
    // an assistant turn with `{`) to force the model into JSON output mode.
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userMsg },
          { role: 'assistant', content: '{' },
        ],
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      console.error('[troubleshoot] Anthropic error', r.status, text);
      return res.status(502).json({ error: 'AI provider error', status: r.status });
    }
    const data = await r.json();
    // Re-attach the prefilled `{` so the response is a complete JSON object.
    const rawContent = data.content?.[0]?.text || '';
    const content = '{' + rawContent;
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (_e) {
      // The most common cause of malformed JSON here is truncation when the
      // model hits the max_tokens ceiling. Surface that explicitly so the user
      // knows it's a length issue, not a model quality issue.
      if (data.stop_reason === 'max_tokens') {
        return res.status(502).json({
          error:
            'AI response was truncated before completing. Try a more focused symptom description, or ask the operator to raise max_tokens.',
          stopReason: data.stop_reason,
        });
      }
      return res.status(502).json({ error: 'AI returned non-JSON response', raw: content });
    }

    // Attach curated resources matching the series + each cause's system, plus
    // parts-vendor search URLs for every part the LLM listed.
    if (Array.isArray(parsed.likelyCauses)) {
      const seriesObj = SERIES.find((s) => s.id === series);
      const seriesLabel = seriesObj ? seriesObj.label : null;

      parsed.likelyCauses = parsed.likelyCauses.map((cause) => {
        const partsNeeded = Array.isArray(cause.partsNeeded)
          ? cause.partsNeeded.map((part) => ({
              ...part,
              vendorLinks: buildPartsSearchUrls(part, seriesLabel, vin),
            }))
          : [];
        return {
          ...cause,
          partsNeeded,
          relatedResources: series
            ? filterResources({ seriesId: series, system: cause.system }).slice(0, 5)
            : [],
          ih8mudSearch: series
            ? ih8mudSearchUrl(series, [cause.title, ...(cause.diagnosticSteps || [])].join(' '))
            : null,
        };
      });
    }

    return res.json({ result: parsed });
  } catch (err) {
    console.error('[troubleshoot] failed:', err);
    return res.status(500).json({ error: 'Troubleshooting failed', detail: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// Health check + fallback
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Land Cruiser Know-It-All listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[warn] ANTHROPIC_API_KEY is not set; /api/troubleshoot will return 503.');
  }
});
