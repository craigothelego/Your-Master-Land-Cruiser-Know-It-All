/* global fetch */

// ---- Tiny DOM helpers ------------------------------------------------------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---- Tab switcher ----------------------------------------------------------

$$('.tab').forEach((btn) =>
  btn.addEventListener('click', () => {
    const id = btn.dataset.tab;
    $$('.tab').forEach((b) => {
      const active = b.dataset.tab === id;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${id}`));
  }),
);

// ---- Bootstrap: load series + system catalog for the dropdowns ------------

let CATALOG = { series: [], systems: [], resourceTypes: [] };

async function loadCatalog() {
  const r = await fetch('/api/series');
  if (!r.ok) return;
  CATALOG = await r.json();

  const seriesOptions = CATALOG.series
    .map((s) => `<option value="${s.id}">${escapeHtml(s.label)}</option>`)
    .join('');
  $('#ts-series').insertAdjacentHTML('beforeend', seriesOptions);
  $('#rs-series').insertAdjacentHTML('beforeend', seriesOptions);

  const sysOptions = CATALOG.systems
    .map((s) => `<option value="${s}">${escapeHtml(s)}</option>`)
    .join('');
  $('#rs-system').insertAdjacentHTML('beforeend', sysOptions);

  const typeOptions = CATALOG.resourceTypes
    .map((t) => `<option value="${t.id}">${escapeHtml(t.label)}</option>`)
    .join('');
  $('#rs-type').insertAdjacentHTML('beforeend', typeOptions);

  loadResources();
}

// ---- VIN lookup ------------------------------------------------------------

const vinForm = $('#vin-form');
const vinInput = $('#vin-input');
const vinResult = $('#vin-result');

vinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const vin = vinInput.value.trim().toUpperCase();
  if (!vin) return;
  vinResult.classList.remove('hidden');
  vinResult.innerHTML = '<div class="card"><span class="spinner"></span>Decoding VIN...</div>';
  try {
    const r = await fetch(`/api/vin/${encodeURIComponent(vin)}`);
    const data = await r.json();
    if (!r.ok) {
      vinResult.innerHTML = `<div class="error">${escapeHtml(data.error || 'VIN decode failed')}${data.detail ? ` (${escapeHtml(data.detail)})` : ''}</div>`;
      return;
    }
    renderVinResult(data);
  } catch (err) {
    vinResult.innerHTML = `<div class="error">Network error: ${escapeHtml(err.message)}</div>`;
  }
});

$$('button.link[data-sample]').forEach((btn) =>
  btn.addEventListener('click', () => {
    vinInput.value = btn.dataset.sample;
    vinForm.dispatchEvent(new Event('submit'));
  }),
);

// ---- VIN: image upload (Claude vision) -------------------------------------

const vinFileInput = $('#vin-image-input');
const vinUploadZone = $('#vin-upload-zone');
const vinUploadPreview = $('#vin-upload-preview');
const vinUploadImg = $('#vin-upload-img');
const vinUploadGo = $('#vin-upload-go');
const vinUploadClear = $('#vin-upload-clear');

let pendingUpload = null; // { base64, mimeType }

/**
 * Resize an image File to fit within max dimensions and return a base64 string
 * (no data:URL prefix) and the chosen mime type. Keeps aspect ratio. Re-encodes
 * to JPEG for non-PNG sources to keep payload tiny.
 */
async function resizeToBase64(file, maxDim = 1600, quality = 0.85) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    // Always re-encode to JPEG for compactness (Claude vision accepts jpg/png/webp/gif).
    const mimeType = 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    return { base64, mimeType, dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function handleVinImage(file) {
  if (!file) return;
  if (!/^image\/(jpe?g|png|webp|gif)$/.test(file.type)) {
    vinResult.classList.remove('hidden');
    vinResult.innerHTML = `<div class="error">Please upload a JPEG, PNG, WebP, or GIF image.</div>`;
    return;
  }
  try {
    const { base64, mimeType, dataUrl } = await resizeToBase64(file);
    pendingUpload = { base64, mimeType };
    vinUploadImg.src = dataUrl;
    vinUploadPreview.classList.remove('hidden');
    vinUploadZone.classList.add('hidden');
  } catch (err) {
    vinResult.classList.remove('hidden');
    vinResult.innerHTML = `<div class="error">Could not read that image: ${escapeHtml(err.message)}</div>`;
  }
}

vinFileInput.addEventListener('change', (e) => handleVinImage(e.target.files?.[0]));

['dragenter', 'dragover'].forEach((ev) =>
  vinUploadZone.addEventListener(ev, (e) => {
    e.preventDefault();
    vinUploadZone.classList.add('dragging');
  }),
);
['dragleave', 'drop'].forEach((ev) =>
  vinUploadZone.addEventListener(ev, (e) => {
    e.preventDefault();
    vinUploadZone.classList.remove('dragging');
  }),
);
vinUploadZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) handleVinImage(file);
});

vinUploadClear.addEventListener('click', () => {
  pendingUpload = null;
  vinFileInput.value = '';
  vinUploadImg.src = '';
  vinUploadPreview.classList.add('hidden');
  vinUploadZone.classList.remove('hidden');
});

vinUploadGo.addEventListener('click', async () => {
  if (!pendingUpload) return;
  vinResult.classList.remove('hidden');
  vinResult.innerHTML = '<div class="card"><span class="spinner"></span>Looking at your photo...</div>';
  vinUploadGo.disabled = true;
  try {
    const r = await fetch('/api/vin/from-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: pendingUpload.base64,
        mimeType: pendingUpload.mimeType,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      vinResult.innerHTML = `<div class="error">${escapeHtml(data.error || 'Image identification failed')}${data.hint ? `<br><small>${escapeHtml(data.hint)}</small>` : ''}</div>`;
      return;
    }
    renderImageIdentificationResult(data);
  } catch (err) {
    vinResult.innerHTML = `<div class="error">Network error: ${escapeHtml(err.message)}</div>`;
  } finally {
    vinUploadGo.disabled = false;
  }
});

function renderImageIdentificationResult({ result, decode }) {
  if (!result) {
    vinResult.innerHTML = `<div class="error">Unexpected empty response.</div>`;
    return;
  }

  if (result.kind === 'vin' && result.vin) {
    vinInput.value = result.vin;
    const banner =
      result.vinConfidence && result.vinConfidence !== 'high'
        ? `<div class="card" style="margin-bottom:10px;"><strong>VIN read from photo (confidence: ${escapeHtml(result.vinConfidence)})</strong>: <code>${escapeHtml(result.vin)}</code>${result.notes ? `<p class="muted" style="margin:6px 0 0;">${escapeHtml(result.notes)}</p>` : ''}</div>`
        : `<div class="card" style="margin-bottom:10px;"><strong>VIN read from photo</strong>: <code>${escapeHtml(result.vin)}</code></div>`;

    if (decode && decode.decoded) {
      // Server already decoded the VIN; render the full card with the banner on top.
      renderVinResult({
        vin: result.vin,
        decoded: decode.decoded,
        series: decode.series,
        isLandCruiserFamily: decode.isLandCruiserFamily,
      });
      vinResult.innerHTML = banner + vinResult.innerHTML;
    } else {
      // Sparse / pre-1981 VIN; trigger the normal flow which handles those cases.
      vinResult.innerHTML = banner + '<div class="card"><span class="spinner"></span>Decoding VIN...</div>';
      vinForm.dispatchEvent(new Event('submit'));
    }
    return;
  }

  if (result.kind === 'vehicle' && result.identification) {
    const id = result.identification;
    const seriesEntry = (CATALOG.series || []).find((s) => s.id === id.series);
    const label = seriesEntry ? seriesEntry.label : id.series;
    vinResult.innerHTML = `
      <div class="vin-card">
        <div class="series-banner">
          <div>
            <div class="series-label">${escapeHtml(label)}</div>
            <div class="muted" style="font-size:13px;margin-top:2px;">Identified visually \u00b7 confidence: ${escapeHtml(id.confidence || 'unknown')}</div>
          </div>
          ${seriesEntry ? `<div class="chassis">${escapeHtml(seriesEntry.chassisCodes.join(' / '))}</div>` : ''}
        </div>
        ${seriesEntry?.blurb ? `<p style="margin:6px 0 10px;">${escapeHtml(seriesEntry.blurb)}</p>` : ''}
        ${id.reasoning ? `<p class="muted"><strong>How we identified it:</strong> ${escapeHtml(id.reasoning)}</p>` : ''}
        ${id.yearRange ? `<p class="muted">Likely year range: ${id.yearRange[0]}\u2013${id.yearRange[1]}</p>` : ''}
        ${result.notes ? `<p class="hint">${escapeHtml(result.notes)}</p>` : ''}
        <p style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          ${seriesEntry ? `<button class="primary" id="img-go-resources">Browse ${escapeHtml(label)} resources</button>` : ''}
          ${seriesEntry ? `<button class="primary" id="img-go-troubleshoot">Troubleshoot a problem</button>` : ''}
        </p>
      </div>`;
    if (seriesEntry) {
      $('#img-go-resources')?.addEventListener('click', () => {
        document.querySelector('.tab[data-tab="resources"]').click();
        const sel = $('#rs-series');
        if (sel) {
          sel.value = seriesEntry.id;
          sel.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      $('#img-go-troubleshoot')?.addEventListener('click', () => {
        document.querySelector('.tab[data-tab="troubleshoot"]').click();
        $('#ts-series').value = seriesEntry.id;
        $('#ts-symptoms').focus();
      });
    }
    return;
  }

  // kind === 'neither'
  vinResult.innerHTML = `<div class="card">
    <strong>Couldn't identify a Land Cruiser in that photo.</strong>
    <p class="muted" style="margin:6px 0 0;">${escapeHtml(result.notes || 'Try a clearer photo of the VIN plate, door jamb sticker, dashboard, or the truck itself.')}</p>
  </div>`;
}

function renderVinResult(data) {
  if (data.preModernVin) {
    vinResult.innerHTML = `
      <div class="vin-card">
        <div class="series-banner">
          <div class="series-label">${escapeHtml(data.series?.label || 'Pre-1981 Land Cruiser')}</div>
          <div class="chassis">${escapeHtml((data.series?.chassisCodes || []).join(' / '))}</div>
        </div>
        <p class="muted">${escapeHtml(data.message)}</p>
        ${data.series?.blurb ? `<p>${escapeHtml(data.series.blurb)}</p>` : ''}
      </div>`;
    return;
  }

  const d = data.decoded || {};
  const s = data.series;
  const rows = [
    ['Year', d.year],
    ['Make', d.make],
    ['Model', d.model],
    ['Trim', d.trim],
    ['Body class', d.bodyClass],
    ['Drive type', d.driveType],
    ['Engine', [d.engineConfig, d.engineCylinders ? `${d.engineCylinders} cyl` : null, d.displacementL ? `${d.displacementL}L` : null, d.fuelType, d.engineModel].filter(Boolean).join(' \u00b7 ')],
    ['Transmission', [d.transmissionStyle, d.transmissionSpeeds ? `${d.transmissionSpeeds}-speed` : null].filter(Boolean).join(' \u00b7 ')],
    ['Plant', [d.plantCity, d.plantCountry].filter(Boolean).join(', ')],
  ].filter(([, v]) => v);

  const banner = s
    ? `<div class="series-banner">
         <div>
           <div class="series-label">${escapeHtml(s.label)}</div>
           <div class="muted" style="font-size:13px;margin-top:2px;">Built ${s.yearRange[0]}\u2013${s.yearRange[1] === 2099 ? 'present' : s.yearRange[1]}</div>
         </div>
         <div class="chassis">${escapeHtml(s.chassisCodes.join(' / '))}</div>
       </div>`
    : '';

  vinResult.innerHTML = `
    <div class="vin-card">
      ${banner}
      ${s?.blurb ? `<p style="margin:6px 0 14px;">${escapeHtml(s.blurb)}</p>` : ''}
      ${data.warning ? `<div class="error" style="margin-bottom:12px;">${escapeHtml(data.warning)}</div>` : ''}
      <dl class="kv">
        ${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}
      </dl>
      ${s?.likelyEngines?.length ? `<p class="hint" style="margin-top:14px;">Common engines for the ${escapeHtml(s.label)}: ${s.likelyEngines.map((e) => `<code>${escapeHtml(e)}</code>`).join(', ')}</p>` : ''}
      ${s ? `<p style="margin-top:12px;"><button class="primary" id="vin-jump-troubleshoot">Troubleshoot a problem on this ${escapeHtml(s.label)}</button></p>` : ''}
    </div>`;

  if (s) {
    $('#vin-jump-troubleshoot').addEventListener('click', () => {
      $('#ts-series').value = s.id;
      $('#ts-year').value = d.year || '';
      $('#ts-engine').value = (s.likelyEngines && s.likelyEngines[0]) || '';
      document.querySelector('.tab[data-tab="troubleshoot"]').click();
      $('#ts-symptoms').focus();
    });
  }
}

// ---- Troubleshoot ----------------------------------------------------------

const tsForm = $('#troubleshoot-form');
const tsResult = $('#troubleshoot-result');
const tsSymptoms = $('#ts-symptoms');
const tsContextToggle = $('#ts-context-toggle');
const tsContext = $('#ts-context');

// Toggle the optional vehicle-context fields.
if (tsContextToggle && tsContext) {
  tsContextToggle.addEventListener('click', () => {
    const open = tsContext.classList.toggle('hidden') === false;
    tsContextToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    tsContextToggle.textContent = open ? '- Hide vehicle context' : '+ Add vehicle context';
    if (open) {
      const firstField = tsContext.querySelector('select, input');
      if (firstField) firstField.focus();
    }
  });
}

// Suggestion chips: prefill the textarea and focus, but do NOT auto-submit
// so the user can edit the prompt before sending.
$$('.suggestion-chips .chip').forEach((chip) =>
  chip.addEventListener('click', () => {
    const text = chip.dataset.prompt || chip.textContent.trim();
    if (!tsSymptoms) return;
    tsSymptoms.value = text;
    tsSymptoms.focus();
    tsSymptoms.setSelectionRange(text.length, text.length);
  }),
);

// Cmd/Ctrl + Enter to submit the prompt from inside the textarea.
if (tsSymptoms) {
  tsSymptoms.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      tsForm.dispatchEvent(new Event('submit'));
    }
  });
}

tsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const symptoms = $('#ts-symptoms').value.trim();
  if (!symptoms) return;
  const series = $('#ts-series').value || undefined;
  const year = $('#ts-year').value || undefined;
  const engine = $('#ts-engine').value || undefined;
  tsResult.classList.remove('hidden');

  // Build a context-aware loading message so the user knows what's happening.
  const contextBits = [];
  if (year) contextBits.push(year);
  if (series) {
    const seriesEntry = (CATALOG.series || []).find((s) => s.id === series);
    contextBits.push(seriesEntry ? seriesEntry.label : series);
  }
  if (engine) contextBits.push(engine);
  const contextLabel = contextBits.length
    ? `your ${contextBits.join(' ')}`
    : 'common Land Cruiser failure modes';

  tsResult.innerHTML = `<div class="card loading-card">
    <div class="loading-head"><span class="spinner"></span><strong>Doing Cruiser Science...</strong></div>
    <ul class="loading-steps">
      <li>Cross-referencing ${escapeHtml(contextLabel)}</li>
      <li>Looking up likely OEM part numbers</li>
      <li>Pulling related ih8mud threads and parts vendors</li>
    </ul>
    <p class="loading-foot muted">Usually takes 5-15 seconds.</p>
  </div>`;
  try {
    const r = await fetch('/api/troubleshoot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, series, year, engine }),
    });
    const data = await r.json();
    if (!r.ok) {
      tsResult.innerHTML = `<div class="error">${escapeHtml(data.error || 'Troubleshoot failed')}${data.hint ? `<br><small>${escapeHtml(data.hint)}</small>` : ''}</div>`;
      return;
    }
    renderTroubleshootResult(data.result, series);
  } catch (err) {
    tsResult.innerHTML = `<div class="error">Network error: ${escapeHtml(err.message)}</div>`;
  }
});

function renderPartsList(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return '';

  const VENDOR_KIND_LABEL = {
    oem: 'OEM',
    aftermarket: 'Aftermarket',
    marketplace: 'Marketplace',
    service: 'Shop',
  };
  const CATEGORY_LABEL = {
    part: 'Part',
    tire: 'Tires',
    fluid: 'Fluid',
    service: 'Service',
    tool: 'Tool',
  };

  const items = parts
    .map((p) => {
      const category = (p.category || 'part').toLowerCase();
      const isService = category === 'service';
      const isPartLike = category === 'part';

      const vendorRows = (p.vendorLinks || [])
        .map(
          (v) =>
            `<a class="vendor-link kind-${escapeHtml(v.kind)}" href="${escapeHtml(v.url)}" target="_blank" rel="noopener">
               <span class="vendor-name">${escapeHtml(v.vendor)}</span>
               <span class="vendor-kind">${escapeHtml(VENDOR_KIND_LABEL[v.kind] || v.kind)}</span>
             </a>`,
        )
        .join('');

      // Only parts get the OEM-number row. Tires, fluids, services, and
      // tools don't have a Toyota OEM part number attached.
      const oemConf = (p.oemPartNumberConfidence || '').toLowerCase();
      const oemLine = isPartLike && p.oemPartNumber
        ? `<p class="part-oem">
             <span class="muted">OEM part #:</span>
             <code class="oem-num">${escapeHtml(p.oemPartNumber)}</code>
             <button class="copy-btn" type="button" data-copy="${escapeHtml(p.oemPartNumber)}" title="Copy part number">Copy</button>
             ${oemConf ? `<span class="badge conf-${escapeHtml(oemConf)}" title="AI confidence">${escapeHtml(oemConf)} confidence</span>` : ''}
             <span class="oem-disclaimer">verify by VIN before purchase</span>
           </p>`
        : '';

      const oemBadge = isPartLike && p.oem
        ? '<span class="badge oem">OEM recommended</span>'
        : '';

      const categoryBadge = `<span class="badge category cat-${escapeHtml(category)}">${escapeHtml(CATEGORY_LABEL[category] || category)}</span>`;

      const searchLine =
        !isService && p.searchTerms && !p.oemPartNumber
          ? `<p class="part-search"><span class="muted">Search:</span> <code>${escapeHtml(p.searchTerms)}</code></p>`
          : '';

      const vendorBlock = isService
        ? `<div class="service-callout">
             <strong>This is a service, not a part.</strong>
             <span class="muted">No purchase needed - the work is done by a shop.</span>
             ${vendorRows ? `<div class="vendor-grid">${vendorRows}</div>` : ''}
           </div>`
        : vendorRows
        ? `<div class="vendor-grid">${vendorRows}</div>`
        : '';

      return `<li class="part cat-${escapeHtml(category)}">
        <div class="part-head">
          <strong>${escapeHtml(p.name)}</strong>
          ${categoryBadge}
          ${oemBadge}
        </div>
        ${oemLine}
        ${p.notes ? `<p class="part-notes">${escapeHtml(p.notes)}</p>` : ''}
        ${searchLine}
        ${vendorBlock}
      </li>`;
    })
    .join('');

  return `<div class="parts-list">
    <h4>Parts &amp; services</h4>
    <ul>${items}</ul>
  </div>`;
}

function renderTroubleshootResult(result, seriesId) {
  if (!result || !Array.isArray(result.likelyCauses)) {
    tsResult.innerHTML = `<div class="error">The AI returned an unexpected response. Try rephrasing your symptoms.</div>`;
    return;
  }

  const out = [];
  out.push(`<div class="card"><div class="summary">${escapeHtml(result.summary || '')}</div></div>`);

  if (result.redFlags?.length) {
    out.push(`<div class="red-flags">
      <h3>Safety / red flags</h3>
      <ul>${result.redFlags.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
    </div>`);
  }

  for (const c of result.likelyCauses) {
    const sev = (c.severity || 'medium').toLowerCase();
    const diy = (c.diyDifficulty || '').toLowerCase();
    const cost = c.estimatedCostUsd
      ? `USD $${c.estimatedCostUsd.low}\u2013$${c.estimatedCostUsd.high}`
      : null;
    const related = (c.relatedResources || [])
      .map(
        (r) =>
          `<li><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a> <small>(${escapeHtml(r.type)})</small></li>`,
      )
      .join('');
    out.push(`<div class="cause">
      <h3>
        ${escapeHtml(c.title)}
        ${c.severity ? `<span class="badge sev-${escapeHtml(sev)}">${escapeHtml(c.severity)}</span>` : ''}
        ${c.system ? `<span class="badge system">${escapeHtml(c.system)}</span>` : ''}
        ${diy ? `<span class="badge diy">DIY: ${escapeHtml(diy)}</span>` : ''}
        ${cost ? `<span class="badge diy">${escapeHtml(cost)}</span>` : ''}
      </h3>
      <p style="margin:0 0 8px;">${escapeHtml(c.explanation || '')}</p>
      ${
        c.diagnosticSteps?.length
          ? `<strong style="font-size:13px;color:var(--text-muted);">Diagnostic steps</strong>
             <ol>${c.diagnosticSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`
          : ''
      }
      ${renderPartsList(c.partsNeeded)}
      ${
        related || c.ih8mudSearch
          ? `<div class="related-list">
              <h4>Related ih8mud threads &amp; resources</h4>
              <ul>${related}${
              c.ih8mudSearch
                ? `<li><a href="${escapeHtml(c.ih8mudSearch)}" target="_blank" rel="noopener">Browse ih8mud threads about this issue \u2192</a></li>`
                : ''
            }</ul>
            </div>`
          : ''
      }
    </div>`);
  }

  tsResult.innerHTML = out.join('\n');
  void seriesId;
}

// ---- Resources -------------------------------------------------------------

const rsForm = $('#resources-form');
const rsResult = $('#resources-result');

rsForm.addEventListener('input', () => loadResources());

async function loadResources() {
  const params = new URLSearchParams();
  const seriesId = $('#rs-series').value;
  const system = $('#rs-system').value;
  const type = $('#rs-type').value;
  const q = $('#rs-q').value.trim();
  if (seriesId) params.set('seriesId', seriesId);
  if (system) params.set('system', system);
  if (type) params.set('type', type);
  if (q) params.set('q', q);

  rsResult.innerHTML = '<div class="card"><span class="spinner"></span>Loading...</div>';
  try {
    const r = await fetch(`/api/resources?${params.toString()}`);
    const data = await r.json();
    renderResources(data, q);
  } catch (err) {
    rsResult.innerHTML = `<div class="error">Network error: ${escapeHtml(err.message)}</div>`;
  }
}

function renderResources(data, q) {
  const items = data.resources || [];
  if (!items.length && !data.ih8mudSearch) {
    rsResult.innerHTML = `<div class="card empty">No resources match those filters yet. Try clearing some filters.</div>`;
    return;
  }

  const groups = {};
  for (const r of items) {
    (groups[r.type] = groups[r.type] || []).push(r);
  }

  const order = ['fsm', 'youtube', 'forum', 'parts-vendor'];
  const labelById = Object.fromEntries(CATALOG.resourceTypes.map((t) => [t.id, t.label]));

  const out = [];
  if (data.ih8mudSearch) {
    out.push(`<div class="card" style="margin-bottom:12px;">
      <strong>Search ih8mud for "${escapeHtml(q)}"</strong>
      <p class="muted" style="margin:4px 0 0;">Scoped to the selected series sub-forum.</p>
      <p style="margin:10px 0 0;"><a class="primary" href="${escapeHtml(data.ih8mudSearch)}" target="_blank" rel="noopener" style="display:inline-block;background:var(--accent);color:#0e1116;padding:8px 14px;border-radius:8px;font-weight:700;text-decoration:none;">Open ih8mud search \u2192</a></p>
    </div>`);
  }

  for (const t of order) {
    const list = groups[t];
    if (!list?.length) continue;
    out.push(`<div class="resource-group">
      <h3>${escapeHtml(labelById[t] || t)}</h3>
      ${list
        .map(
          (r) => `<div class="resource-item">
            <div class="title-row">
              <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a>
              <div class="tags">
                ${(r.systems || []).map((s) => `<span class="badge system">${escapeHtml(s)}</span>`).join('')}
              </div>
            </div>
            ${r.notes ? `<small>${escapeHtml(r.notes)}</small>` : ''}
          </div>`,
        )
        .join('')}
    </div>`);
  }

  rsResult.innerHTML = out.join('\n');
}

// ---- Copy-to-clipboard (delegated; works for OEM part-number badges) ------

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const text = btn.dataset.copy;
  if (!text) return;
  const restore = btn.textContent;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = restore), 1200);
    })
    .catch(() => {
      btn.textContent = 'Copy failed';
      setTimeout(() => (btn.textContent = restore), 1200);
    });
});

// ---- Hero gallery ----------------------------------------------------------

$$('.hero-card').forEach((card) =>
  card.addEventListener('click', () => {
    const seriesId = card.dataset.series;
    if (!seriesId) return;
    document.querySelector('.tab[data-tab="resources"]').click();
    const sel = $('#rs-series');
    if (sel) {
      sel.value = seriesId;
      sel.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.getElementById('tab-resources').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }),
);

// ---- Boot ------------------------------------------------------------------

loadCatalog();
