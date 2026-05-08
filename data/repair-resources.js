/**
 * Curated repair / reference resources for Land Cruiser owners.
 *
 * Resources are tagged by `seriesIds` (matching ids in landcruiser-series.js)
 * and by `systems` (cooling, electrical, drivetrain, etc.) so they can be
 * filtered for the user.
 *
 * URL policy:
 *   - Top-level domains and forum sub-forum URLs are kept ONLY when verified
 *     (e.g. via web search of the actual forum).
 *   - For everything else (specific write-ups, FSM threads we can't verify),
 *     we use Google site-scoped search URLs (`site:forum.ih8mud.com ...`)
 *     so the user lands on a Google results page where every link is a real
 *     ih8mud thread ranked by relevance. This is more reliable than guessing
 *     thread IDs.
 *
 * If you find a known-good direct thread URL, replace the site-search entry
 * here.
 */

const SYSTEMS = [
  'engine',
  'cooling',
  'fuel',
  'electrical',
  'drivetrain',
  'transmission',
  'transfer-case',
  'axles',
  'suspension',
  'steering',
  'brakes',
  'body',
  'interior',
  'hvac',
  'ahc', // Lexus hydraulic suspension
  'general',
];

// ---------------------------------------------------------------------------
// Verified ih8mud sub-forum URLs (confirmed via direct lookup).
// Anything not in this map falls back to whole-site Google search.
// ---------------------------------------------------------------------------
const IH8MUD_SUBFORUM_PATH = {
  '40-series': '/forums/40-55-series-tech.8/',
  '55-series': '/forums/40-55-series-tech.8/',
  '60-series': '/forums/60-series-wagons.27/',
  '70-series': '/forums/70-series-tech.86/',
  '80-series': '/forums/80-series-tech.9/',
  lx450: '/forums/80-series-tech.9/',
  '100-series': '/forums/100-series-cruisers.26/',
  lx470: '/forums/100-series-cruisers.26/',
  '200-series': '/forums/200-series-cruisers.136/',
  lx570: '/forums/200-series-cruisers.136/',
  '300-series': '/forums/300-series-lc300-lx600-lx700h.393/',
  lx600: '/forums/300-series-lc300-lx600-lx700h.393/',
};

/** Build a Google site-search URL scoped to ih8mud (and a sub-forum if known). */
function googleIh8mud(seriesId, query) {
  const path = IH8MUD_SUBFORUM_PATH[seriesId];
  const site = path ? `site:forum.ih8mud.com${path}` : 'site:forum.ih8mud.com';
  const q = `${site} ${query || ''}`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

const RESOURCES = [
  // ---- Top-level forum hubs (verified domains) -----------------------------
  {
    id: 'ih8mud-home',
    title: 'ih8mud.com - the Land Cruiser community',
    url: 'https://forum.ih8mud.com/',
    type: 'forum',
    seriesIds: ['40-series', '55-series', '60-series', '70-series', '80-series', '100-series', '200-series', '300-series', 'j250', 'lx450', 'lx470', 'lx570', 'lx600', 'prado-j90', 'prado-j120', 'prado-j150'],
    systems: ['general'],
    notes: 'The most active Land Cruiser community on the internet. Per-series sub-forums; strong RoW/diesel coverage too.',
  },
  {
    id: 'aulro',
    title: 'AULRO - Australian 4WD & Land Cruiser community',
    url: 'https://forum.aulro.com/',
    type: 'forum',
    seriesIds: ['60-series', '70-series', '80-series', '100-series', '200-series', '300-series', 'prado-j90', 'prado-j120', 'prado-j150', 'j250'],
    systems: ['general'],
    notes: 'Australian forum; superb diesel and 70-series knowledge, including 1HD-FTE and 1VD-FTV deep dives.',
  },
  {
    id: 'lcool',
    title: 'lcool.org - Land Cruiser Owners On Line (UK/EU)',
    url: 'https://www.lcool.org/',
    type: 'forum',
    seriesIds: ['60-series', '70-series', '80-series', '100-series', '200-series', '300-series', 'prado-j90', 'prado-j120', 'prado-j150'],
    systems: ['general'],
    notes: 'UK/European Land Cruiser community; strong diesel and Prado coverage.',
  },
  {
    id: 'expedition-portal',
    title: 'Expedition Portal - Toyota forum',
    url: 'https://expeditionportal.com/forum/forums/toyota.39/',
    type: 'forum',
    seriesIds: ['70-series', '80-series', '100-series', '200-series', '300-series', 'j250', 'prado-j120', 'prado-j150'],
    systems: ['general'],
    notes: 'International overlanders; very useful for 70-series and Prado overland builds.',
  },

  // ---- Verified ih8mud sub-forum URLs --------------------------------------
  { id: 'ih8mud-40', title: 'ih8mud - 40 / 55 Series Tech', url: 'https://forum.ih8mud.com/forums/40-55-series-tech.8/', type: 'forum', seriesIds: ['40-series', '55-series'], systems: ['general'] },
  { id: 'ih8mud-60', title: 'ih8mud - 60 Series Wagons', url: 'https://forum.ih8mud.com/forums/60-series-wagons.27/', type: 'forum', seriesIds: ['60-series'], systems: ['general'] },
  { id: 'ih8mud-70', title: 'ih8mud - 70 Series Tech', url: 'https://forum.ih8mud.com/forums/70-series-tech.86/', type: 'forum', seriesIds: ['70-series'], systems: ['general'] },
  { id: 'ih8mud-80', title: 'ih8mud - 80 Series Tech', url: 'https://forum.ih8mud.com/forums/80-series-tech.9/', type: 'forum', seriesIds: ['80-series', 'lx450'], systems: ['general'] },
  { id: 'ih8mud-100', title: 'ih8mud - 100 Series Cruisers', url: 'https://forum.ih8mud.com/forums/100-series-cruisers.26/', type: 'forum', seriesIds: ['100-series', 'lx470'], systems: ['general'] },
  { id: 'ih8mud-200', title: 'ih8mud - 200 Series Cruisers', url: 'https://forum.ih8mud.com/forums/200-series-cruisers.136/', type: 'forum', seriesIds: ['200-series', 'lx570'], systems: ['general'] },
  { id: 'ih8mud-300', title: 'ih8mud - 300 Series / LX600 / LX700h', url: 'https://forum.ih8mud.com/forums/300-series-lc300-lx600-lx700h.393/', type: 'forum', seriesIds: ['300-series', 'lx600'], systems: ['general'] },

  // ---- ih8mud sections we don't have a verified URL for: site-search hubs --
  {
    id: 'ih8mud-j250-search',
    title: 'ih8mud - 250 Series threads (search)',
    url: googleIh8mud('j250', '250 series'),
    type: 'forum',
    seriesIds: ['j250'],
    systems: ['general'],
    notes: 'Live Google search of ih8mud for J250-related threads.',
  },
  {
    id: 'ih8mud-prado-search',
    title: 'ih8mud - Prado threads (search)',
    url: 'https://www.google.com/search?q=' + encodeURIComponent('site:forum.ih8mud.com Prado'),
    type: 'forum',
    seriesIds: ['prado-j90', 'prado-j120', 'prado-j150'],
    systems: ['general'],
    notes: 'Live Google search of ih8mud for Prado threads (J90 / J120 / J150).',
  },
  {
    id: 'ih8mud-diesel-search',
    title: 'ih8mud - Diesel Tech threads (search)',
    url: 'https://www.google.com/search?q=' + encodeURIComponent('site:forum.ih8mud.com diesel 1HZ 1HD-FT 1HD-FTE 1KZ-TE 1KD-FTV 1VD-FTV 1GD-FTV'),
    type: 'forum',
    seriesIds: ['60-series', '70-series', '80-series', '100-series', '200-series', 'prado-j90', 'prado-j120', 'prado-j150'],
    systems: ['engine', 'fuel'],
    notes: '1HZ, 1HD-FTE, 1KZ-TE, 1KD-FTV, 1VD-FTV, 1GD-FTV diesels.',
  },

  // ---- Factory Service Manuals --------------------------------------------
  {
    id: 'fsm-cruisercult',
    title: 'Cruiser Cult - Factory Service Manuals (FSM hub)',
    url: 'https://www.cruisercult.com/factory-service-manuals',
    type: 'fsm',
    seriesIds: [
      '40-series', '55-series', '60-series', '70-series',
      '80-series', '100-series', '200-series', '300-series',
      'lx450', 'lx470', 'lx570', 'lx600',
      'prado-j90', 'prado-j120', 'prado-j150', 'j250',
    ],
    systems: ['general'],
    notes: 'Curated FSM index covering most Land Cruiser and Lexus LX generations.',
  },
  {
    id: 'fsm-fzj80-1994',
    title: 'FSM 1994 FZJ80 (community PDF on ih8mud)',
    url: 'https://forum.ih8mud.com/threads/fsm-1994-fzj80.1252989/',
    type: 'fsm',
    seriesIds: ['80-series', 'lx450'],
    systems: ['general'],
    notes: 'Verified ih8mud thread with a Google-Drive-hosted PDF compiled from Toyota TIS.',
  },
  {
    id: 'fsm-search-40',
    title: 'FSM threads on ih8mud - 40 / 55 Series',
    url: googleIh8mud('40-series', 'FSM factory service manual'),
    type: 'fsm',
    seriesIds: ['40-series', '55-series'],
    systems: ['general'],
  },
  {
    id: 'fsm-search-60',
    title: 'FSM threads on ih8mud - 60 Series',
    url: googleIh8mud('60-series', 'FSM factory service manual FJ60 FJ62'),
    type: 'fsm',
    seriesIds: ['60-series'],
    systems: ['general'],
  },
  {
    id: 'fsm-search-100',
    title: 'FSM threads on ih8mud - 100 Series / LX470',
    url: googleIh8mud('100-series', 'FSM factory service manual UZJ100 LX470'),
    type: 'fsm',
    seriesIds: ['100-series', 'lx470'],
    systems: ['general'],
  },
  {
    id: 'fsm-search-200',
    title: 'FSM threads on ih8mud - 200 Series / LX570',
    url: googleIh8mud('200-series', 'FSM factory service manual URJ200 LX570'),
    type: 'fsm',
    seriesIds: ['200-series', 'lx570'],
    systems: ['general'],
  },

  // ---- High-value individual threads (verified) ---------------------------
  {
    id: 'ih8mud-80-faq',
    title: 'ih8mud - 80 Series FAQ (general info, modifications, repairs)',
    url: 'https://forum.ih8mud.com/threads/80-series-faq.84888/',
    type: 'guide',
    seriesIds: ['80-series', 'lx450'],
    systems: ['general'],
    notes: 'Pinned, regularly updated 80-series knowledge base on ih8mud.',
  },

  // ---- Common-issue write-ups (search-based; clicking lands on real threads)
  {
    id: 'guide-80-birfields',
    title: '80 Series birfield / knuckle service threads',
    url: googleIh8mud('80-series', 'birfield knuckle rebuild write-up'),
    type: 'guide',
    seriesIds: ['80-series', 'lx450'],
    systems: ['axles', 'drivetrain'],
  },
  {
    id: 'guide-100-starter',
    title: '100 Series / LX470 starter replacement (under-intake)',
    url: googleIh8mud('100-series', '2UZ-FE starter replacement under intake write-up'),
    type: 'guide',
    seriesIds: ['100-series', 'lx470'],
    systems: ['electrical', 'engine'],
  },
  {
    id: 'guide-lx470-ahc',
    title: 'LX470 AHC (Active Height Control) - explained / service',
    url: googleIh8mud('lx470', 'AHC active height control accumulator globe pressure'),
    type: 'guide',
    seriesIds: ['lx470'],
    systems: ['ahc', 'suspension'],
  },
  {
    id: 'guide-200-kdss',
    title: '200 Series KDSS - explained / service',
    url: googleIh8mud('200-series', 'KDSS kinetic dynamic suspension explained service'),
    type: 'guide',
    seriesIds: ['200-series', 'lx570'],
    systems: ['suspension'],
  },
  {
    id: 'guide-1fz-phh',
    title: '1FZ-FE PHH (#6 cylinder coolant pipe) - 80 Series',
    url: googleIh8mud('80-series', '1FZ-FE PHH pesky heater hose number 6 coolant pipe'),
    type: 'guide',
    seriesIds: ['80-series', 'lx450'],
    systems: ['cooling', 'engine'],
  },

  // ---- YouTube channels (verified channels) -------------------------------
  {
    id: 'yt-tinkerers',
    title: "Tinkerer's Adventure (YouTube)",
    url: 'https://www.youtube.com/@TinkerersAdventure',
    type: 'youtube',
    seriesIds: ['80-series', '100-series', 'lx470', '200-series'],
    systems: ['general', 'engine', 'drivetrain', 'suspension'],
    notes: 'Practical wrenching tutorials, especially strong on 80 and 100 series.',
  },
  {
    id: 'yt-cruiser-outfitters',
    title: 'Cruiser Outfitters (YouTube)',
    url: 'https://www.youtube.com/@CruiserOutfitters',
    type: 'youtube',
    seriesIds: ['40-series', '60-series', '80-series', '100-series', '200-series'],
    systems: ['general', 'suspension', 'drivetrain'],
  },
  {
    id: 'yt-valley-hybrids',
    title: 'Valley Hybrids (YouTube)',
    url: 'https://www.youtube.com/@valleyhybrids',
    type: 'youtube',
    seriesIds: ['40-series', '60-series', '80-series'],
    systems: ['general', 'engine', 'electrical'],
    notes: 'FJ40/FJ60/FJ62 restoration shop with detailed how-to videos.',
  },
  {
    id: 'yt-overlandbound',
    title: 'Overland Bound (YouTube)',
    url: 'https://www.youtube.com/@OverlandBound',
    type: 'youtube',
    seriesIds: ['80-series', '100-series', '200-series', 'j250'],
    systems: ['general', 'suspension'],
  },

  // ---- Parts vendors (verified domains) -----------------------------------
  {
    id: 'cruiser-outfitters-parts',
    title: 'Cruiser Outfitters (parts)',
    url: 'https://www.cruiseroutfitters.com/',
    type: 'parts-vendor',
    seriesIds: ['40-series', '55-series', '60-series', '70-series', '80-series', '100-series', '200-series'],
    systems: ['general'],
    notes: 'Enthusiast-run, deep Land Cruiser-specific parts inventory.',
  },
  {
    id: 'olathe-toyota',
    title: 'Olathe Toyota Parts (OEM)',
    url: 'https://www.olathetoyotaparts.com/',
    type: 'parts-vendor',
    seriesIds: ['40-series', '60-series', '80-series', '100-series', '200-series', '300-series', 'j250', 'lx450', 'lx470', 'lx570', 'lx600'],
    systems: ['general'],
    notes: 'Discounted OEM Toyota parts with VIN lookup. The default OEM-parts source for many enthusiasts.',
  },
  {
    id: 'beno-japan',
    title: "Beno's Japanese Cruiser Parts",
    url: 'https://www.benoscruisers.com/',
    type: 'parts-vendor',
    seriesIds: ['40-series', '55-series', '60-series', '80-series'],
    systems: ['general'],
    notes: 'Specializes in older Land Cruisers and JDM-sourced parts.',
  },
  {
    id: 'amayama',
    title: 'Amayama (JDM OEM parts, ships worldwide)',
    url: 'https://www.amayama.com/',
    type: 'parts-vendor',
    seriesIds: ['40-series', '55-series', '60-series', '70-series', '80-series', '100-series', '200-series', '300-series'],
    systems: ['general'],
    notes: 'Useful for RoW-only parts (70 series, JDM 80, diesel-specific parts).',
  },
  {
    id: 'partsouq',
    title: 'PartSouq (international OEM parts)',
    url: 'https://partsouq.com/',
    type: 'parts-vendor',
    seriesIds: ['40-series', '55-series', '60-series', '70-series', '80-series', '100-series', '200-series', '300-series', 'j250'],
    systems: ['general'],
    notes: 'Searchable OEM catalog with VIN lookup. Good cross-reference for part numbers.',
  },
  {
    id: 'rockauto',
    title: 'RockAuto (US, aftermarket)',
    url: 'https://www.rockauto.com/',
    type: 'parts-vendor',
    seriesIds: ['80-series', '100-series', '200-series', 'lx450', 'lx470', 'lx570'],
    systems: ['general'],
    notes: 'Aftermarket and some OEM parts; great for routine maintenance items. Ships internationally but US-focused.',
  },
  {
    id: 'arb',
    title: 'ARB 4x4 Accessories (global)',
    url: 'https://www.arb.com.au/',
    type: 'parts-vendor',
    seriesIds: ['40-series', '60-series', '70-series', '80-series', '100-series', '200-series', '300-series', 'prado-j90', 'prado-j120', 'prado-j150', 'j250'],
    systems: ['general', 'suspension', 'axles'],
    notes: 'Australian-origin global brand: Old Man Emu suspension, Air Lockers, bumpers, drawer systems. Distributors in most countries.',
  },
  {
    id: 'toyota-spares-online',
    title: 'Toyota Spares Online (Australia)',
    url: 'https://www.toyotasparesonline.com.au/',
    type: 'parts-vendor',
    seriesIds: ['60-series', '70-series', '80-series', '100-series', '200-series', '300-series', 'prado-j90', 'prado-j120', 'prado-j150', 'j250'],
    systems: ['general'],
    notes: 'Australian OEM Toyota parts catalog with VIN lookup; ships worldwide.',
  },
  {
    id: 'just-jap',
    title: 'Just Jap (Australia)',
    url: 'https://www.justjap.com/',
    type: 'parts-vendor',
    seriesIds: ['70-series', '80-series', '100-series', '200-series', 'prado-j120', 'prado-j150'],
    systems: ['general', 'engine', 'suspension'],
    notes: 'Australian aftermarket and performance parts.',
  },
  {
    id: 'roughtrax',
    title: 'Roughtrax 4x4 (UK)',
    url: 'https://www.roughtrax4x4.com/',
    type: 'parts-vendor',
    seriesIds: ['40-series', '60-series', '70-series', '80-series', '100-series', '200-series', 'prado-j90', 'prado-j120', 'prado-j150'],
    systems: ['general'],
    notes: 'UK Toyota 4x4 specialist; OEM and quality aftermarket; ships across Europe.',
  },
  {
    id: 'milner',
    title: 'Milner Off Road (UK)',
    url: 'https://www.milneroffroad.com/',
    type: 'parts-vendor',
    seriesIds: ['40-series', '60-series', '70-series', '80-series', '100-series', '200-series', 'prado-j90', 'prado-j120', 'prado-j150'],
    systems: ['general'],
    notes: 'Long-running UK 4x4 parts house; broad Toyota Land Cruiser catalog including diesel-specific items.',
  },
  {
    id: 'tlc4x4',
    title: 'TLC4x4 (UK / EU)',
    url: 'https://www.tlc4x4.com/',
    type: 'parts-vendor',
    seriesIds: ['70-series', '80-series', '100-series', '200-series', 'prado-j120', 'prado-j150'],
    systems: ['general', 'suspension'],
    notes: 'UK Land Cruiser specialist; popular for HDJ80 and 1HD-FTE owners.',
  },
  {
    id: 'opposite-lock',
    title: 'Opposite Lock (Australia)',
    url: 'https://www.oppositelock.com.au/',
    type: 'parts-vendor',
    seriesIds: ['70-series', '80-series', '100-series', '200-series', '300-series', 'prado-j120', 'prado-j150', 'j250'],
    systems: ['general', 'suspension'],
    notes: 'Aussie 4WD chain; bullbars, suspension kits, drawer systems for the local Land Cruiser/Prado fleet.',
  },
];

/**
 * Resource types in display order, with friendly labels.
 */
const RESOURCE_TYPES = [
  { id: 'fsm', label: 'Factory Service Manual' },
  { id: 'guide', label: 'Repair Guide / Write-up' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'forum', label: 'Forum' },
  { id: 'parts-vendor', label: 'Parts Vendor' },
];

/**
 * Build a URL that lands the user on a list of ACTUAL ih8mud threads about
 * the given query, using Google's site-scoped search restricted to the right
 * sub-forum path (when known).
 */
function ih8mudSearchUrl(seriesId, query) {
  return googleIh8mud(seriesId, query);
}

/**
 * Filter resources by series and (optionally) system.
 *
 * @param {{ seriesId?: string, system?: string, type?: string }} opts
 * @returns {typeof RESOURCES}
 */
function filterResources({ seriesId, system, type } = {}) {
  return RESOURCES.filter((r) => {
    if (seriesId && !r.seriesIds.includes(seriesId)) return false;
    if (system && !r.systems.includes(system)) return false;
    if (type && r.type !== type) return false;
    return true;
  });
}

module.exports = {
  SYSTEMS,
  RESOURCES,
  RESOURCE_TYPES,
  ih8mudSearchUrl,
  filterResources,
};
