/**
 * Land Cruiser series / chassis-code knowledge base.
 *
 * NHTSA's vPIC API decodes a VIN into year/make/model/engine, but it does NOT
 * give enthusiasts what they actually want: the chassis/series code (e.g. "80
 * Series" / "FZJ80"). This module layers that knowledge on top of the NHTSA
 * decode result, using model year + decoded model name (and, when needed, the
 * VIN's WMI/VDS bytes) to identify the series and generation.
 *
 * Coverage focuses on Land Cruiser (and sibling Lexus LX) variants commonly
 * found in North America and the wider enthusiast community.
 */

/**
 * Each entry describes a generation. `match(year, model, vin, nhtsaSeries)`
 * returns true if the decoded vehicle belongs to this generation.
 *
 * `model` is the lowercased NHTSA-decoded model string (e.g. "land cruiser",
 * "land cruiser prado", "lx 470", "lx570"). `vin` is the original 17-char
 * (or shorter for pre-1981) VIN. `nhtsaSeries` is the (uppercased) chassis
 * code returned in NHTSA's `Series` field when available (e.g. "FZJ80L",
 * "GRJ150"); this is the strongest signal for non-US-market vehicles where
 * the model string alone may not disambiguate the generation.
 *
 * Helper: `chassisHit(prefixes, vin, nhtsaSeries)` checks whether any of the
 * given chassis-code prefixes appears in either the VIN's VDS bytes or the
 * NHTSA Series field.
 */
function chassisHit(prefixes, vin, nhtsaSeries) {
  const v = (vin || '').toUpperCase();
  const ns = (nhtsaSeries || '').toUpperCase();
  return prefixes.some((p) => ns.startsWith(p) || ns.includes(p) || v.includes(p));
}
const SERIES = [
  // ---- 40 Series (1960-1984) -------------------------------------------------
  {
    id: '40-series',
    label: '40 Series',
    chassisCodes: ['FJ40', 'FJ43', 'FJ45', 'BJ40', 'BJ42', 'HJ45', 'HJ47'],
    yearRange: [1960, 1984],
    enginesByCode: {
      FJ40: ['F (3.9L I6 gas)', '2F (4.2L I6 gas)'],
      BJ40: ['B (3.0L I4 diesel)', '3B (3.4L I4 diesel)'],
      HJ45: ['H (3.6L I6 diesel)'],
    },
    blurb:
      'The original utilitarian Land Cruiser. Solid axles front and rear, leaf springs, and the legendary F / 2F inline-six gas engine (or B-series diesel in many markets). Pre-1981 examples used short VINs (chassis-only numbers). Restoration-favorite worldwide.',
    match: (year, model) =>
      year >= 1960 && year <= 1984 && /land\s*cruiser/.test(model) && !/prado/.test(model),
  },

  // ---- 55 Series wagon (1967-1980) ------------------------------------------
  {
    id: '55-series',
    label: '55 Series ("Iron Pig")',
    chassisCodes: ['FJ55'],
    yearRange: [1967, 1980],
    enginesByCode: {
      FJ55: ['F (3.9L I6 gas)', '2F (4.2L I6 gas)'],
    },
    blurb:
      'The four-door station wagon that bridged the 40 and 60 series. Affectionately called the "Iron Pig." Same F / 2F drivetrain as the 40, with a longer wheelbase and a proper wagon body.',
    match: (year, model, vin, ns) =>
      year >= 1967 && year <= 1980 && /land\s*cruiser/.test(model) && chassisHit(['FJ55'], vin, ns),
  },

  // ---- 60 Series (1980-1990) -------------------------------------------------
  {
    id: '60-series',
    label: '60 Series',
    chassisCodes: ['FJ60', 'FJ62', 'HJ60', 'HJ61', 'HZJ60'],
    yearRange: [1980, 1990],
    enginesByCode: {
      FJ60: ['2F (4.2L I6 carbureted gas)'],
      FJ62: ['3F-E (4.0L I6 EFI gas)'],
      HJ61: ['12H-T (4.0L I6 turbo diesel)'],
    },
    blurb:
      'First "civilized" Land Cruiser wagon: A/C, carpet, and a proper interior, but still solid axles and a body-on-frame chassis. FJ60 (1981-1987) is carbureted 2F; FJ62 (1988-1990) gets the EFI 3F-E and a 4-speed automatic. RoW markets got HJ60/HJ61 with diesels (2H, 12H-T). Hugely capable, easy to maintain.',
    match: (year, model) =>
      year >= 1980 && year <= 1990 && /land\s*cruiser/.test(model) && !/prado/.test(model),
  },

  // ---- 70 Series (1984-present, mostly RoW) ---------------------------------
  {
    id: '70-series',
    label: '70 Series',
    chassisCodes: ['BJ70', 'BJ73', 'BJ74', 'HZJ75', 'HZJ78', 'HZJ79', 'VDJ76', 'VDJ78', 'VDJ79', 'GRJ76', 'GRJ79', 'LC76', 'LC78', 'LC79'],
    yearRange: [1984, 2099],
    enginesByCode: {
      HZJ75: ['1HZ (4.2L I6 diesel)'],
      VDJ79: ['1VD-FTV (4.5L V8 turbo diesel)'],
      GRJ76: ['1GR-FE (4.0L V6 gas)'],
    },
    blurb:
      'The hardcore, work-truck Land Cruiser. Never officially sold in the US/Canada (federally), still produced today in Australia, Africa, the Middle East, Latin America, and Japan. Solid axles front and rear, manual transmissions common. 1HZ diesel and 1VD-FTV V8 turbo diesel are the iconic engines; 1GR-FE V6 gas in some markets.',
    match: (year, model, vin, ns) =>
      /land\s*cruiser/.test(model) &&
      !/prado/.test(model) &&
      chassisHit(['BJ7', 'HZJ7', 'VDJ7', 'PZJ7', 'FZJ7', 'HDJ7', 'GRJ7', 'LC7'], vin, ns),
  },

  // ---- 80 Series (1990-1997) -------------------------------------------------
  {
    id: '80-series',
    label: '80 Series',
    chassisCodes: ['FJ80', 'FZJ80', 'HZJ80', 'HDJ80', 'HDJ81'],
    yearRange: [1990, 1997],
    enginesByCode: {
      FJ80: ['3F-E (4.0L I6 EFI gas, 1991-1992 USDM)'],
      FZJ80: ['1FZ-FE (4.5L DOHC I6 EFI gas, 1993-1997 USDM)'],
      HDJ80: ['1HD-T / 1HD-FT (4.2L I6 turbo diesel, RoW)'],
    },
    blurb:
      'The enthusiast favorite. Full-time 4WD, coil springs all around, triple-locked from the factory in many markets (1995-1997 USDM with center, front, and rear lockers; HDJ81 RoW models often had factory front/rear lockers too). 1FZ-FE 4.5L DOHC I6 in gas markets; 1HD-T / 1HD-FT / 1HD-FTE I6 turbo diesels in RoW. Considered by many to be the peak Land Cruiser.',
    match: (year, model) =>
      year >= 1990 && year <= 1997 && /land\s*cruiser/.test(model) && !/prado/.test(model),
  },
  {
    id: 'lx450',
    label: 'Lexus LX 450 (80 Series)',
    chassisCodes: ['FZJ80'],
    yearRange: [1996, 1997],
    enginesByCode: {
      FZJ80: ['1FZ-FE (4.5L DOHC I6 EFI gas)'],
    },
    blurb:
      'Lexus-badged 80 Series, sold in the US for 1996-1997 only. Mechanically identical to the FZJ80 USDM Land Cruiser; differences are cosmetic and trim-level.',
    match: (year, model, vin, ns) =>
      (year >= 1996 && year <= 1997 && /lx\s*450/.test(model)) ||
      (/lx/.test(model) && chassisHit(['FZJ80'], vin, ns) && (year ? year <= 1997 : true)),
  },

  // ---- 100 Series (1998-2007) -----------------------------------------------
  {
    id: '100-series',
    label: '100 Series',
    chassisCodes: ['UZJ100', 'HZJ105', 'HDJ100'],
    yearRange: [1998, 2007],
    enginesByCode: {
      UZJ100: ['2UZ-FE (4.7L V8 gas)'],
      HZJ105: ['1HZ (4.2L I6 diesel, RoW)'],
      HDJ100: ['1HD-FTE (4.2L I6 turbo diesel, RoW)'],
    },
    blurb:
      'First V8 Land Cruiser (USDM). 2UZ-FE 4.7L V8 is famously durable. IFS up front (independent front suspension) replaced the solid front axle on USDM/wagon trucks; the HZJ105 RoW model kept solid axles with the 1HZ I6 diesel, and HDJ100 markets got the 1HD-FTE 4.2L turbo diesel. Watch for starter, head gasket (rare on petrol), and timing belt service intervals.',
    match: (year, model) =>
      year >= 1998 && year <= 2007 && /land\s*cruiser/.test(model) && !/prado/.test(model),
  },
  {
    id: 'lx470',
    label: 'Lexus LX 470 (100 Series)',
    chassisCodes: ['UZJ100'],
    yearRange: [1998, 2007],
    enginesByCode: {
      UZJ100: ['2UZ-FE (4.7L V8 gas)'],
    },
    blurb:
      'Lexus-badged 100 Series with AHC (Active Height Control) hydraulic suspension. Same 2UZ-FE V8 as the USDM Land Cruiser. AHC is the major service-cost differentiator vs the LC100.',
    match: (year, model, vin, ns) =>
      (year >= 1998 && year <= 2007 && /lx\s*470/.test(model)) ||
      (/lx/.test(model) && chassisHit(['UZJ100'], vin, ns) && (year ? year >= 1998 && year <= 2007 : true)),
  },

  // ---- 200 Series (2008-2021 USDM, longer in other markets) -----------------
  {
    id: '200-series',
    label: '200 Series',
    chassisCodes: ['URJ200', 'UZJ200', 'VDJ200', 'GRJ200'],
    yearRange: [2008, 2021],
    enginesByCode: {
      URJ200: ['3UR-FE (5.7L V8 gas, 2008-2021 USDM)'],
      UZJ200: ['2UZ-FE (4.7L V8 gas, 2008-2009 RoW)'],
      VDJ200: ['1VD-FTV (4.5L V8 turbo diesel, RoW)'],
    },
    blurb:
      'Last "old-school" V8 Land Cruiser in the US (3UR-FE 5.7L V8). RoW markets got the 1VD-FTV 4.5L V8 turbo diesel (VDJ200) and, early on, the 2UZ-FE V8 petrol (UZJ200). 6-speed (later 8-speed) automatic, KDSS (Kinetic Dynamic Suspension System), Crawl Control, Multi-Terrain Select. Pulled from the US market after 2021 but continued globally to 2022. Lexus equivalent: LX 570.',
    match: (year, model) =>
      year >= 2008 && year <= 2022 && /land\s*cruiser/.test(model) && !/prado/.test(model),
  },
  {
    id: 'lx570',
    label: 'Lexus LX 570 (200 Series)',
    chassisCodes: ['URJ201'],
    yearRange: [2008, 2021],
    enginesByCode: {
      URJ201: ['3UR-FE (5.7L V8 gas)'],
    },
    blurb:
      'Lexus-badged 200 Series. 3UR-FE V8, AHC hydraulic suspension, more luxury content than the LC200. Sold in the US through 2021.',
    match: (year, model, vin, ns) =>
      (year >= 2008 && year <= 2021 && /lx\s*570/.test(model)) ||
      (/lx/.test(model) && chassisHit(['URJ201', 'URJ200'], vin, ns) && (year ? year >= 2008 && year <= 2021 : true)),
  },

  // ---- 300 Series (2022+) ---------------------------------------------------
  {
    id: '300-series',
    label: '300 Series',
    chassisCodes: ['VJA300', 'FJA300', 'GDJ300'],
    yearRange: [2022, 2099],
    enginesByCode: {
      VJA300: ['V35A-FTS (3.5L twin-turbo V6 gas)'],
      FJA300: ['F33A-FTV (3.3L twin-turbo V6 diesel)'],
    },
    blurb:
      'New global flagship Land Cruiser, on the TNGA-F platform. Twin-turbo V6 (gas or diesel) replaces the V8. Lighter, stiffer chassis. Sold globally from 2022; not officially sold in the US (the J250 took that slot in 2024). GR Sport variant adds e-KDSS and locking diffs.',
    match: (year, model, vin, ns) =>
      year >= 2022 &&
      /land\s*cruiser(\s*300)?/.test(model) &&
      !/prado|250/.test(model) &&
      !chassisHit(['GDJ250', 'TDA250'], vin, ns),
  },
  {
    id: 'lx600',
    label: 'Lexus LX 600 (300 Series)',
    chassisCodes: ['VJA310'],
    yearRange: [2022, 2099],
    enginesByCode: {
      VJA310: ['V35A-FTS (3.5L twin-turbo V6 gas)'],
    },
    blurb:
      'Lexus-badged 300 Series. Twin-turbo V6, 10-speed automatic, full luxury treatment. Sold in the US from 2022.',
    match: (year, model, vin, ns) =>
      (year >= 2022 && /lx\s*600/.test(model)) ||
      (/lx/.test(model) && chassisHit(['VJA310'], vin, ns)),
  },

  // ---- J250 (2024+ USDM revival) --------------------------------------------
  {
    id: 'j250',
    label: 'J250 ("2024+ Land Cruiser" / Prado successor)',
    chassisCodes: ['GDJ250', 'TDA250'],
    yearRange: [2024, 2099],
    enginesByCode: {
      TDA250: ['T24A-FTS (2.4L turbo i-Force MAX hybrid, USDM)'],
    },
    blurb:
      'Revival of the Land Cruiser nameplate in the US for 2024. Built on TNGA-F like the 300 Series but smaller; this is the global Prado-successor sold as "Land Cruiser" in the US/Canada and as "Land Cruiser Prado" or "Land Cruiser 250" elsewhere. US gets the i-Force MAX hybrid; RoW markets also get 2.8L 1GD-FTV diesel and 2.7L petrol options. Retro-styled "1958" trim available.',
    match: (year, model, vin, ns) =>
      year >= 2024 &&
      /land\s*cruiser/.test(model) &&
      (chassisHit(['GDJ250', 'TDA250', 'J250'], vin, ns) || /250/.test(model) || !chassisHit(['VJA300', 'FJA300', 'GDJ300'], vin, ns)),
  },

  // ---- Land Cruiser Prado (Light Duty / "Mid-size" Land Cruiser, RoW) ------
  // The Prado is sold as "Land Cruiser Prado" in most markets and as "Land
  // Cruiser" (J250) in North America from 2024. Earlier generations (J70 Light,
  // J90, J120, J150) are core to the global Land Cruiser story even though
  // they were never sold in the US. (Lexus GX 460/470 are J120/J150 siblings.)

  {
    id: 'prado-j90',
    label: 'Prado J90',
    chassisCodes: ['KZJ90', 'KZJ95', 'RZJ90', 'RZJ95', 'VZJ90', 'VZJ95'],
    yearRange: [1996, 2002],
    enginesByCode: {
      KZJ90: ['1KZ-TE (3.0L I4 turbo diesel)'],
      RZJ90: ['3RZ-FE (2.7L I4 gas)'],
      VZJ90: ['5VZ-FE (3.4L V6 gas)'],
    },
    blurb:
      "First Prado on its own platform (90 series). Sold across Asia, Europe, Australia, and the Middle East. Coil-sprung front and rear, mostly part-time 4WD. The 1KZ-TE diesel is the iconic engine; cracking heads on 1KZ are a known issue and a frequent forum topic.",
    match: (year, model, vin, ns) =>
      year >= 1996 && year <= 2002 &&
      (/prado/.test(model) || chassisHit(['KZJ9', 'RZJ9', 'VZJ9'], vin, ns)),
  },
  {
    id: 'prado-j120',
    label: 'Prado J120',
    chassisCodes: ['KDJ120', 'KDJ125', 'GRJ120', 'GRJ125', 'KZJ120', 'TRJ120', 'VZJ120', 'RZJ120'],
    yearRange: [2002, 2009],
    enginesByCode: {
      KDJ120: ['1KD-FTV (3.0L I4 turbo diesel)'],
      GRJ120: ['1GR-FE (4.0L V6 gas)'],
      TRJ120: ['2TR-FE (2.7L I4 gas)'],
    },
    blurb:
      'Second-generation Prado (120 series). Lexus GX 470 is the badge-engineered sibling. 1KD-FTV diesel and 1GR-FE V6 gas dominate. KDSS appears on certain trims. Watch for diesel injector seals, EGR carbon, and front lower ball-joint wear.',
    match: (year, model, vin, ns) =>
      year >= 2002 && year <= 2009 &&
      (/prado/.test(model) || chassisHit(['KDJ12', 'GRJ12', 'TRJ12', 'KZJ12', 'VZJ12', 'RZJ12'], vin, ns)),
  },
  {
    id: 'prado-j150',
    label: 'Prado J150',
    chassisCodes: ['GRJ150', 'GRJ151', 'KDJ150', 'KDJ155', 'TRJ150', 'TRJ155', 'GDJ150', 'GDJ155', 'LJ150'],
    yearRange: [2009, 2024],
    enginesByCode: {
      GRJ150: ['1GR-FE (4.0L V6 gas)'],
      KDJ150: ['1KD-FTV (3.0L I4 turbo diesel, pre-2015)'],
      GDJ150: ['1GD-FTV (2.8L I4 turbo diesel, 2015+)'],
      TRJ150: ['2TR-FE (2.7L I4 gas)'],
    },
    blurb:
      "Third-generation Prado (150 series). Lexus GX 460 is the badge-engineered sibling. Long production run (2009-2024) with multiple facelifts. 1GD-FTV 2.8L diesel from 2015 onwards is the modern workhorse. KDSS optional. Common topics: diesel particulate filter (DPF) regeneration, AHC (where fitted), and rear coil to airbag conversions on heavier-loaded examples.",
    match: (year, model, vin, ns) =>
      year >= 2009 && year <= 2024 &&
      (/prado/.test(model) || chassisHit(['GRJ15', 'KDJ15', 'TRJ15', 'GDJ15', 'LJ150'], vin, ns)),
  },
];

/**
 * Identify the Land Cruiser generation given an NHTSA decode + the original VIN.
 *
 * @param {{ year: number|string, make: string, model: string }} decoded
 * @param {string} vin
 * @returns {{
 *   id: string,
 *   label: string,
 *   chassisCodes: string[],
 *   yearRange: [number, number],
 *   blurb: string,
 *   likelyEngines: string[]
 * } | null}
 */
function identifySeries(decoded, vin) {
  const year = parseInt(decoded.year, 10);
  const model = (decoded.model || '').toLowerCase();
  const nhtsaSeries = (decoded.nhtsaSeries || '').toUpperCase();
  if (!year || !model) return null;

  for (const s of SERIES) {
    if (s.match(year, model, vin || '', nhtsaSeries)) {
      const engines = Object.values(s.enginesByCode).flat();
      return {
        id: s.id,
        label: s.label,
        chassisCodes: s.chassisCodes,
        yearRange: s.yearRange,
        blurb: s.blurb,
        likelyEngines: engines,
      };
    }
  }
  return null;
}

module.exports = { SERIES, identifySeries };
