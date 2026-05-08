/**
 * Curated repair / reference resources for Land Cruiser owners.
 *
 * Resources are tagged by `seriesIds` (matching ids in landcruiser-series.js)
 * and by `systems` (cooling, electrical, drivetrain, etc.) so they can be
 * filtered for the user. Forum search URLs into ih8mud.com are generated
 * dynamically per series in server.js.
 *
 * Sources are curated and skew toward the strongest community references.
 * URLs may go stale over time -- treat this file as the place to update them.
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

const RESOURCES = [
  // ---- Forum hubs ----------------------------------------------------------
  {
    id: 'ih8mud-home',
    title: 'ih8mud.com - the Land Cruiser community',
    url: 'https://forum.ih8mud.com/',
    type: 'forum',
    seriesIds: ['40-series', '55-series', '60-series', '70-series', '80-series', '100-series', '200-series', '300-series', 'j250', 'lx450', 'lx470', 'lx570', 'lx600', 'prado-j90', 'prado-j120', 'prado-j150'],
    systems: ['general'],
    notes: 'The single most important Land Cruiser community on the internet. Per-series sub-forums; strong RoW/diesel coverage too.',
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

  // ---- Per-series ih8mud sub-forums ---------------------------------------
  { id: 'ih8mud-40', title: 'ih8mud - 40 Series Tech', url: 'https://forum.ih8mud.com/forums/40-series-tech.41/', type: 'forum', seriesIds: ['40-series', '55-series'], systems: ['general'] },
  { id: 'ih8mud-60', title: 'ih8mud - 60 Series Tech', url: 'https://forum.ih8mud.com/forums/60-series-wagons.42/', type: 'forum', seriesIds: ['60-series'], systems: ['general'] },
  { id: 'ih8mud-70', title: 'ih8mud - 70 Series Tech', url: 'https://forum.ih8mud.com/forums/70-series-tech.99/', type: 'forum', seriesIds: ['70-series'], systems: ['general'] },
  { id: 'ih8mud-80', title: 'ih8mud - 80 Series Tech', url: 'https://forum.ih8mud.com/forums/80-series-tech.43/', type: 'forum', seriesIds: ['80-series', 'lx450'], systems: ['general'] },
  { id: 'ih8mud-100', title: 'ih8mud - 100 Series', url: 'https://forum.ih8mud.com/forums/100-series-cruisers.44/', type: 'forum', seriesIds: ['100-series', 'lx470'], systems: ['general'] },
  { id: 'ih8mud-200', title: 'ih8mud - 200 Series', url: 'https://forum.ih8mud.com/forums/200-series-cruisers.139/', type: 'forum', seriesIds: ['200-series', 'lx570'], systems: ['general'] },
  { id: 'ih8mud-300', title: 'ih8mud - 300 Series', url: 'https://forum.ih8mud.com/forums/300-series-cruisers.231/', type: 'forum', seriesIds: ['300-series', 'lx600'], systems: ['general'] },
  { id: 'ih8mud-j250', title: 'ih8mud - 250 Series', url: 'https://forum.ih8mud.com/forums/250-series.241/', type: 'forum', seriesIds: ['j250'], systems: ['general'] },
  { id: 'ih8mud-prado', title: 'ih8mud - Prado (90/120/150)', url: 'https://forum.ih8mud.com/forums/prado.85/', type: 'forum', seriesIds: ['prado-j90', 'prado-j120', 'prado-j150'], systems: ['general'] },
  { id: 'ih8mud-diesel', title: 'ih8mud - Diesel Tech (RoW engines)', url: 'https://forum.ih8mud.com/forums/diesel-tech.45/', type: 'forum', seriesIds: ['60-series', '70-series', '80-series', '100-series', '200-series', 'prado-j90', 'prado-j120', 'prado-j150'], systems: ['engine', 'fuel'], notes: 'Catch-all for 1HZ, 1HD-T/FT/FTE, 12H-T, 1KZ-TE, 1KD-FTV, 1VD-FTV, 1GD-FTV diesels.' },

  // ---- Factory Service Manuals --------------------------------------------
  {
    id: 'fsm-80-series',
    title: 'FZJ80 Factory Service Manual (community-hosted PDFs)',
    url: 'https://forum.ih8mud.com/threads/fsm-fzj80-factory-service-manual.51/',
    type: 'fsm',
    seriesIds: ['80-series', 'lx450'],
    systems: ['general'],
    notes: 'Community-hosted FSM scans for the 80 Series.',
  },
  {
    id: 'fsm-100-series',
    title: '100 Series / LX470 FSM thread',
    url: 'https://forum.ih8mud.com/threads/100-series-fsm.36842/',
    type: 'fsm',
    seriesIds: ['100-series', 'lx470'],
    systems: ['general'],
  },
  {
    id: 'fsm-60-series',
    title: 'FJ60 / FJ62 FSM thread',
    url: 'https://forum.ih8mud.com/threads/fj60-fj62-fsm-pdfs.17074/',
    type: 'fsm',
    seriesIds: ['60-series'],
    systems: ['general'],
  },
  {
    id: 'fsm-40-series',
    title: 'FJ40 FSM thread',
    url: 'https://forum.ih8mud.com/threads/fj40-fsm-and-other-resources.5034/',
    type: 'fsm',
    seriesIds: ['40-series', '55-series'],
    systems: ['general'],
  },

  // ---- YouTube channels ----------------------------------------------------
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

  // ---- Parts vendors -------------------------------------------------------
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

  // ---- International parts vendors ----------------------------------------
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

  // ---- Common-issue write-ups (a few starter examples) --------------------
  {
    id: '80-birfields',
    title: '80 Series birfield re-pack write-up',
    url: 'https://forum.ih8mud.com/threads/birfield-knuckle-rebuild-write-up.6477/',
    type: 'guide',
    seriesIds: ['80-series', 'lx450'],
    systems: ['axles', 'drivetrain'],
    notes: 'The classic 80-series knuckle service walk-through.',
  },
  {
    id: '100-starter',
    title: '100 Series / LX470 starter replacement (under-intake)',
    url: 'https://forum.ih8mud.com/threads/100-series-starter-replacement-write-up.105/',
    type: 'guide',
    seriesIds: ['100-series', 'lx470'],
    systems: ['electrical', 'engine'],
    notes: 'Famous 2UZ-FE starter job; intake manifold has to come off.',
  },
  {
    id: 'lx470-ahc',
    title: 'LX470 AHC (Active Height Control) reference',
    url: 'https://forum.ih8mud.com/threads/ahc-system-explained.50027/',
    type: 'guide',
    seriesIds: ['lx470'],
    systems: ['ahc', 'suspension'],
  },
  {
    id: '200-kdss',
    title: '200 Series KDSS overview & service',
    url: 'https://forum.ih8mud.com/threads/kdss-explained.488820/',
    type: 'guide',
    seriesIds: ['200-series', 'lx570'],
    systems: ['suspension'],
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
 * Build an ih8mud forum search URL scoped to a particular series sub-forum.
 *
 * @param {string} seriesId
 * @param {string} query
 * @returns {string|null}
 */
function ih8mudSearchUrl(seriesId, query) {
  const map = {
    '40-series': 41,
    '55-series': 41,
    '60-series': 42,
    '70-series': 99,
    '80-series': 43,
    'lx450': 43,
    '100-series': 44,
    'lx470': 44,
    '200-series': 139,
    'lx570': 139,
    '300-series': 231,
    'lx600': 231,
    'j250': 241,
    'prado-j90': 85,
    'prado-j120': 85,
    'prado-j150': 85,
  };
  const forumId = map[seriesId];
  const q = encodeURIComponent(query || '');
  if (!forumId) return `https://forum.ih8mud.com/search/?q=${q}`;
  return `https://forum.ih8mud.com/search/?q=${q}&c[nodes][0]=${forumId}`;
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
