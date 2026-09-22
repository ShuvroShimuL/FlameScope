// Will It Burn? — turns a question (or tapped controls) into a cabin scenario,
// checks it against the envelope of the BASS-II records, and builds the answer.
// Every number returned here comes from data/bass-table.csv or from a cited source.
import { records, provenance } from './evidence.mjs';

export class InputError extends Error {}

const KPA_PER_PSI = 6.894757;
const round1 = x => Math.round(x * 10) / 10;
const kpa = psi => round1(psi * KPA_PER_PSI);

export const SOURCES = {
  report: { name: 'NASA/TM-20210011385, Table 5.1, printed p. 57 (BASS-II)', url: provenance.source },
  gravityRods: { name: 'Scientific Reports (2018): The Effect of Gravity on Flame Spread over PMMA Cylinders', url: 'https://www.nature.com/articles/s41598-017-18398-4' },
  atmosphere: { name: 'NASA/TP-2010-216134: exploration atmosphere recommendation', url: 'https://www.nasa.gov/wp-content/uploads/2023/03/henninger-8.2-34-atm-tp216134-2010.pdf' },
  saffire: { name: 'NASA Glenn: Flame burns out on NASA’s long-running spacecraft fire experiment (Saffire)', url: 'https://www.nasa.gov/centers-and-facilities/glenn/flame-burns-out-on-nasas-long-running-spacecraft-fire-experiment/' },
  sofie: { name: 'NASA Glenn: Solid Fuel Ignition and Extinction (SoFIE)', url: 'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/solid-fuel-ignition-and-extinction-sofie/' },
  partialGravity: { name: 'Fire Safety Journal (2024): Partial gravity flammability of cast PMMA rods', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0379711224001802' },
  candle: { name: 'NASA: Candle flame in 1g vs microgravity', url: 'https://www.nasa.gov/image-article/candle-flame-1g-vs-microgravity/' }
};

export const MISSIONS = [
  { id: 'iss', name: 'ISS', sub: 'Low Earth orbit', g: 0, gText: 'µg', gName: 'microgravity', home: 'Earth is hours away', air: 'earth',
    phrase: 'on the ISS', note: 'The station runs Earth-normal air.' },
  { id: 'moon', name: 'Moon base', sub: 'Artemis surface habitat', g: 0.166, gText: '0.17 g', gName: 'lunar gravity · 1/6 g', adj: 'lunar', home: 'Earth is days away', air: 'exploration',
    phrase: 'on a Moon base', note: 'NASA’s habitat concept: 8.2 psi at 34% O₂, so crews can start spacewalks quickly.' },
  { id: 'transit', name: 'Mars transit', sub: 'Deep-space cruise', g: 0, gText: 'µg', gName: 'microgravity', home: 'Earth is months away', air: 'earth',
    phrase: 'on the way to Mars', note: 'Cabin air isn’t chosen yet. Flip it and watch the evidence change.' },
  { id: 'mars', name: 'Mars base', sub: 'Surface habitat', g: 0.38, gText: '0.38 g', gName: 'Martian gravity', adj: 'Martian', home: 'Earth is months away', air: 'exploration',
    phrase: 'on a Mars base', note: 'Assumes the same exploration air as the Moon base.' }
];

export const AIRS = {
  earth: { key: 'earth', name: 'Earth-normal', psi: 14.7, o2: 21, phrase: 'in Earth-normal air' },
  exploration: { key: 'exploration', name: 'Exploration', psi: 8.2, o2: 34, phrase: 'in exploration air' }
};

// Order matters: the first match in this list wins among unsupported materials.
export const MATERIALS = [
  { id: 'pmma', name: 'Acrylic (PMMA) sheet', inline: 'acrylic', supported: true, re: /acrylic|pmma|plexi(?:glass)?|perspex|polymethyl/ },
  { id: 'nomex', name: 'Nomex', inline: 'Nomex', re: /nomex/ },
  { id: 'cotton', name: 'Cotton fabric', inline: 'cotton fabric', re: /cotton/ },
  { id: 'fabric', name: 'Fabric', inline: 'fabric', re: /fabric|cloth|textile/ },
  { id: 'wire', name: 'Wire insulation', inline: 'wire insulation', re: /\bwires?\b|cable|insulation/ },
  { id: 'kapton', name: 'Kapton', inline: 'Kapton', re: /kapton|polyimide/ },
  { id: 'ptfe', name: 'Teflon (PTFE)', inline: 'Teflon', re: /teflon|ptfe/ },
  { id: 'ultem', name: 'Ultem', inline: 'Ultem', re: /ultem/ },
  { id: 'mylar', name: 'Mylar', inline: 'Mylar', re: /mylar/ },
  { id: 'paper', name: 'Paper', inline: 'paper', re: /paper|cardboard/ },
  { id: 'foam', name: 'Foam', inline: 'foam', re: /foam|polyurethane/ },
  { id: 'velcro', name: 'Velcro', inline: 'Velcro', re: /velcro/ },
  { id: 'nylon', name: 'Nylon', inline: 'nylon', re: /nylon/ },
  { id: 'silicone', name: 'Silicone', inline: 'silicone', re: /silicone/ },
  { id: 'fuel', name: 'Liquid or gas fuel', inline: 'liquid or gas fuel', re: /methane|ethanol|propane|hydrogen|jp-?8|kerosene|gasoline|\bfuel\b|droplet/ },
  { id: 'wax', name: 'Candle wax', inline: 'candle wax', re: /candle|\bwax\b/ }
];

// What the 20 BASS-II rows actually cover. Derived from the data, not typed in.
export const ENVELOPE = (() => {
  const o2 = records.flatMap(r => [r.oxygenInitial, r.oxygenFinal]);
  const flow = records.flatMap(r => r.velocity);
  const thicknesses = [...new Set(records.map(r => r.thicknessMm))].sort((a, b) => a - b);
  const o2Min = Math.min(...o2), o2Max = Math.max(...o2);
  return {
    gravity: 0, psi: 14.7, psiTolerance: 0.5,
    pressureNote: 'Pressure is not listed in the table. BASS-II ran in the station’s glovebox at about 1 atm.',
    o2Min, o2Max, po2Min: round1(kpa(14.7) * o2Min / 100), po2Max: round1(kpa(14.7) * o2Max / 100),
    flowMin: Math.min(...flow), flowMax: Math.max(...flow), thicknesses, material: 'pmma'
  };
})();

const PATTERNS = {
  mission: {
    transit: /mars transit|(?:way|trip|journey|flight|travel(?:ling)?|cruise) to mars|\bto mars\b|in transit|deep[- ]space|\bcruise\b/,
    mars: /\bmars\b|martian|মঙ্গল/,
    moon: /\bmoon\b|lunar|artemis|চাঁদ/,
    iss: /\biss\b|space ?station|low[- ]earth orbit|\bleo\b|\borbit\b|microgravity|zero[- ]?g\b|weightless|µg/
  },
  exploration: /exploration|high[- ]oxygen|oxygen[- ]rich|enriched|low[- ]pressure|reduced pressure/,
  earth: /earth[- ]normal|normal air|sea[- ]level|regular air|ordinary air|station air|iss air/,
  pressure: /(\d+(?:\.\d+)?)\s*(psia?|kpa|atm)\b/,
  oxygen: /(\d+(?:\.\d+)?)\s*(?:%|percent|per cent)\s*(?:o2|oxygen)|(?:o2|oxygen)[^\d]{0,15}(\d+(?:\.\d+)?)\s*(?:%|percent)/,
  percent: /(\d+(?:\.\d+)?)\s*(?:%|percent)/,
  thickness: /(\d+(?:\.\d+)?)\s*(?:mm|millimet(?:er|re)s?)\b/g,
  flow: /(\d+(?:\.\d+)?)\s*cm\s*\/\s*s(?:ec)?\b/,
  stillAir: /still air|no (?:air ?flow|ventilation|fans?|breeze)|fans? off|quiescent|stagnant|without (?:air ?flow|ventilation|fans?)/,
  safety: /\bsafe(?:st|r|ty)?\b|certif|approv|recommend|fire ?proof|guarantee|নিরাপদ/
};

/** Reads a free-text question. Returns only the fields it found, plus notices. */
export function parseQuestion(text = '') {
  const q = String(text).toLowerCase().replace(/o₂/g, 'o2').replace(/\s+/g, ' ').trim();
  const fields = {}, notices = [];
  if (!q) return { fields, notices, empty: true };

  const hits = Object.entries(PATTERNS.mission).map(([id, re]) => ({ id, i: q.search(re) })).filter(h => h.i >= 0);
  const places = (hits.some(h => h.id === 'transit') ? hits.filter(h => h.id !== 'mars') : hits).sort((a, b) => a.i - b.i);
  if (places.length) {
    fields.mission = places[0].id;
    if (places.length > 1) notices.push(`You mentioned more than one place, so this shows ${MISSIONS.find(m => m.id === fields.mission).name}. Tap a mission to switch.`);
  }

  if (PATTERNS.exploration.test(q)) fields.air = 'exploration';
  else if (PATTERNS.earth.test(q)) fields.air = 'earth';
  const p = PATTERNS.pressure.exec(q);
  if (p) {
    const v = +p[1], unit = p[2];
    const psi = unit.startsWith('psi') ? v : unit === 'kpa' ? v / KPA_PER_PSI : v * 14.696;
    if (psi > 0 && psi <= 30) fields.psi = round1(psi);
    else notices.push('That pressure is outside what a crewed cabin uses, so it was ignored.');
  }
  const o = PATTERNS.oxygen.exec(q) || PATTERNS.percent.exec(q);
  if (o) {
    const v = +(o[1] ?? o[2]);
    if (v > 0 && v <= 100) fields.o2 = v;
  }

  const sizes = [...new Set([...q.matchAll(PATTERNS.thickness)].map(m => +m[1]))];
  if (sizes.length === 1) fields.thickness = sizes[0];
  else if (sizes.length > 1) { fields.thickness = 'all'; notices.push(`Comparing ${sizes.join(' mm and ')} mm sheets, so every thickness is shown.`); }
  else {
    const thin = /\bthin(?:ner|nest)?\b/.test(q), thick = /\bthick(?:er|est)?\b/.test(q);
    if (thin && thick) { fields.thickness = 'all'; notices.push('Comparing thin and thick sheets, so every thickness is shown.'); }
    else if (thin) { fields.thickness = ENVELOPE.thicknesses[0]; notices.push(`Read “thin” as the thinnest tested sheet, ${fields.thickness} mm.`); }
    else if (thick) { fields.thickness = ENVELOPE.thicknesses.at(-1); notices.push(`Read “thick” as the thickest tested sheet, ${fields.thickness} mm.`); }
  }

  const f = PATTERNS.flow.exec(q);
  if (f) fields.airflow = +f[1];
  else if (PATTERNS.stillAir.test(q)) fields.airflow = 0;

  const found = MATERIALS.filter(m => m.re.test(q));
  if (found.length) {
    const others = found.filter(m => !m.supported);
    fields.material = found.some(m => m.supported) ? 'pmma' : others[0].id;
    if (fields.material === 'pmma' && others.length) notices.push(`Only acrylic is in this data, so ${others.map(m => m.inline).join(' and ')} isn’t shown.`);
  }

  if (PATTERNS.safety.test(q)) notices.push('This shows what NASA observed. It can’t certify a material as safe.');
  if (!Object.keys(fields).length) notices.push('No place, material or cabin condition found in that question, so the defaults are shown. Try a suggestion below.');
  return { fields, notices, empty: false };
}

const given = (params, key) => params[key] !== undefined && params[key] !== null && params[key] !== '';
function number(value, label, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new InputError(`${label} must be a number from ${min} to ${max}.`);
  return n;
}

/** Explicit params (tapped controls) beat the question, and the question beats defaults. */
export function resolveScenario(params = {}) {
  if (given(params, 'q') && String(params.q).length > 500) throw new InputError('Keep the question under 500 characters.');
  const parsed = parseQuestion(params.q);
  const from = {};
  const pick = key => {
    if (given(params, key)) { from[key] = 'picked'; return params[key]; }
    if (parsed.fields[key] !== undefined) { from[key] = 'question'; return parsed.fields[key]; }
    from[key] = 'default'; return undefined;
  };

  const missionId = pick('mission') ?? 'iss';
  const mission = MISSIONS.find(m => m.id === missionId);
  if (!mission) throw new InputError('Unknown mission. Use iss, moon, transit or mars.');

  let airKey, airFrom;
  if (given(params, 'air')) { airKey = params.air; airFrom = 'picked'; }
  else if (parsed.fields.air) { airKey = parsed.fields.air; airFrom = 'question'; }
  else { airKey = mission.air; airFrom = 'default'; }
  if (!AIRS[airKey]) throw new InputError('Unknown cabin air. Use earth or exploration.');
  let { psi, o2 } = AIRS[airKey];
  const useParsedNumbers = !given(params, 'air');
  if (given(params, 'o2')) { o2 = number(params.o2, 'Oxygen', 1, 100); airFrom = 'picked'; }
  else if (useParsedNumbers && parsed.fields.o2 !== undefined) { o2 = parsed.fields.o2; airFrom = 'question'; }
  if (given(params, 'psi')) { psi = number(params.psi, 'Pressure', 1, 30); airFrom = 'picked'; }
  else if (useParsedNumbers && parsed.fields.psi !== undefined) { psi = parsed.fields.psi; airFrom = 'question'; }
  const air = airFor(psi, o2);
  from.air = airFrom;

  const materialId = pick('material') ?? 'pmma';
  const material = MATERIALS.find(m => m.id === materialId);
  if (!material) throw new InputError('Unknown material.');

  const t = pick('thickness');
  const thickness = t === undefined || t === 'all' ? null : number(t, 'Thickness', 0.1, 50);
  const a = pick('airflow');
  const airflow = a === undefined || a === 'none' ? null : number(a, 'Airflow', 0, 200);

  return { mission, air, material: { id: material.id, name: material.name, inline: material.inline, supported: !!material.supported }, thickness, airflow, from, parsed };
}

function airFor(psi, o2) {
  const preset = Object.values(AIRS).find(a => a.psi === psi && a.o2 === o2);
  return { key: preset ? preset.key : 'custom', name: preset ? preset.name : 'Custom', psi, o2, kpa: kpa(psi), po2: round1(kpa(psi) * o2 / 100) };
}

function checksFor(s) {
  const E = ENVELOPE;
  const range = (a, b, unit = '') => a === b ? `${a}${unit}` : `${a}–${b}${unit}`;
  const checks = [
    { key: 'material', label: 'Material', yours: s.material.name.replace(' sheet', ''), tested: 'Acrylic (PMMA)', ok: s.material.supported },
    { key: 'gravity', label: 'Gravity', yours: s.mission.gText, tested: 'µg (ISS)', ok: s.mission.g === E.gravity },
    { key: 'oxygen', label: 'Oxygen', yours: `${s.air.o2}%`, tested: range(E.o2Min, E.o2Max, '%'), ok: s.air.o2 >= E.o2Min && s.air.o2 <= E.o2Max },
    { key: 'pressure', label: 'Pressure', yours: `${s.air.psi} psi`, tested: '≈14.7 psi', ok: Math.abs(s.air.psi - E.psi) <= E.psiTolerance, note: E.pressureNote }
  ];
  if (s.airflow !== null) checks.push({ key: 'airflow', label: 'Airflow', yours: s.airflow === 0 ? 'Still air' : `${s.airflow} cm/s`, tested: range(E.flowMin, E.flowMax, ' cm/s'), ok: s.airflow >= E.flowMin && s.airflow <= E.flowMax });
  if (s.thickness !== null) checks.push({ key: 'thickness', label: 'Thickness', yours: `${s.thickness} mm`, tested: range(E.thicknesses[0], E.thicknesses.at(-1), ' mm'), ok: E.thicknesses.includes(s.thickness) });
  return checks;
}

function subsetFor(s) { return records.filter(r => s.thickness === null || r.thicknessMm === s.thickness); }

function headlineFor(s, failed) {
  const E = ENVELOPE, first = failed[0];
  if (first === 'material') return `Unknown. There’s no ${s.material.inline} data in this set.`;
  if (first === 'gravity') return `Unknown. None of these tests felt ${s.mission.adj} gravity.`;
  if (first === 'oxygen') return s.air.o2 > E.o2Max ? `Unknown. These tests stopped at ${E.o2Max}% oxygen.` : `Unknown. These tests never went below ${E.o2Min}% oxygen.`;
  if (first === 'pressure') return 'Unknown. These tests only ran at station pressure.';
  if (first === 'airflow') return s.airflow === 0 ? 'Unknown. These tests never ran in still air.' : s.airflow < E.flowMin ? `Unknown. These tests never ran below ${E.flowMin} cm/s.` : `Unknown. These tests never ran above ${E.flowMax} cm/s.`;
  return `Unknown. These tests only used ${E.thicknesses[0]}–${E.thicknesses.at(-1)} mm sheets.`;
}

function gapsFor(s, failed) {
  const E = ENVELOPE, gaps = [], has = k => failed.includes(k);
  if (has('material')) gaps.push({ topic: 'Material', text: `This prototype only holds NASA’s acrylic (PMMA) sheet tests. ${s.material.name} needs more NASA reports added to the corpus.`, source: SOURCES.report });
  if (has('gravity')) {
    gaps.push({ topic: 'Gravity', text: 'Partial gravity is barely tested. NASA Glenn’s centrifuge drop tests give only about five seconds of Moon-like gravity at a time.', source: SOURCES.partialGravity });
    gaps.push({ topic: 'Gravity', text: 'Early centrifuge results suggest lunar-level gravity may be a worst case: enough rising gas to feed a flame, not enough to blow it out.', source: SOURCES.partialGravity });
  }
  if (has('oxygen') || has('pressure')) {
    const inside = s.air.po2 >= E.po2Min && s.air.po2 <= E.po2Max;
    const n2Ratio = (s.air.kpa * (1 - s.air.o2 / 100)) / (kpa(14.7) * 0.79);
    const nitrogen = n2Ratio < 0.5 ? ' But it has less than half the nitrogen that soaks up a flame’s heat, so the ISS tests don’t stretch that far.'
      : n2Ratio < 0.9 ? ' But it has less nitrogen to soak up a flame’s heat, so the ISS tests don’t stretch that far.' : '';
    gaps.push(inside
      ? { topic: 'Oxygen & pressure', text: `Your cabin’s oxygen partial pressure, ${s.air.po2} kPa, sits inside the tested ${E.po2Min}–${E.po2Max} kPa.${nitrogen}`, source: SOURCES.atmosphere }
      : { topic: 'Oxygen & pressure', text: `Your cabin’s oxygen partial pressure, ${s.air.po2} kPa, is outside the tested ${E.po2Min}–${E.po2Max} kPa as well.`, source: SOURCES.report });
    if (s.air.o2 > E.o2Max || s.air.psi < E.psi - E.psiTolerance) gaps.push({ topic: 'Where the data is', text: 'Saffire V and VI burned samples at about 8.2 psi and 34% O₂ inside uncrewed Cygnus ships. They are next in line for our corpus.', source: SOURCES.saffire });
    if (!has('gravity')) gaps.push({ topic: 'Where the data is', text: 'SoFIE, in the station’s Combustion Integrated Rack, can test exploration atmospheres at reduced pressure.', source: SOURCES.sofie });
  }
  if (has('airflow')) gaps.push(s.airflow < E.flowMin
    ? { topic: 'Airflow', text: `Still air is its own regime. With no flow, oxygen reaches a flame only by slow diffusion, and every one of these tests had at least ${E.flowMin} cm/s of airflow.`, source: SOURCES.candle }
    : { topic: 'Airflow', text: `Flows above ${E.flowMax} cm/s weren’t tested in this set.`, source: SOURCES.report });
  if (has('thickness')) gaps.push({ topic: 'Thickness', text: `BASS-II tested ${E.thicknesses.join(', ')} mm sheets. Thinner sheets spread faster in these tests, so the data doesn’t support stretching it to ${s.thickness} mm.`, source: SOURCES.report });
  return gaps;
}

function nearestFor(s, failed) {
  const params = {}, changes = [];
  if (failed.includes('material')) { params.material = 'pmma'; changes.push('acrylic'); }
  if (failed.includes('gravity')) { params.mission = 'iss'; params.air = 'earth'; changes.push('the ISS', 'Earth-normal air'); }
  else if (failed.includes('oxygen') || failed.includes('pressure')) { params.air = 'earth'; changes.push('Earth-normal air'); }
  if (failed.includes('airflow')) { params.airflow = 'none'; changes.push('any tested airflow'); }
  if (failed.includes('thickness')) {
    const near = ENVELOPE.thicknesses.reduce((a, b) => Math.abs(b - s.thickness) < Math.abs(a - s.thickness) ? b : a);
    params.thickness = near; changes.push(`${near} mm sheets`);
  }
  return { label: 'Show the nearest evidence we have', changes: `Switches to ${changes.join(', ')}.`, params };
}

function evidenceFor(s) {
  const subset = subsetFor(s);
  const pairs = subset.flatMap(r => (r.spread || []).map((spread, i) => ({ id: r.id, thicknessMm: r.thicknessMm, velocity: r.velocity[i], spread })));
  const fastest = pairs.reduce((a, b) => b.spread > a.spread ? b : a);
  const slowest = pairs.reduce((a, b) => b.spread < a.spread ? b : a);
  const burn = subset.map(r => r.burnMin);
  let finding;
  if (s.thickness === null) {
    const maxFor = t => Math.max(...records.filter(r => r.thicknessMm === t && r.spread).flatMap(r => r.spread));
    const thin = ENVELOPE.thicknesses[0], thick = ENVELOPE.thicknesses.at(-1), f1 = maxFor(thin), f5 = maxFor(thick);
    finding = { lead: 'Thin sheets spread faster.', text: `The fastest ${thin} mm sheet moved ${Math.round(f1 / f5)}× faster than any ${thick} mm sheet (${f1} vs ${f5} mm/s).` };
  } else {
    const flows = pairs.map(p => p.velocity);
    finding = { lead: `${s.thickness} mm sheets`, text: `spread at ${slowest.spread}–${fastest.spread} mm/s across ${Math.min(...flows)}–${Math.max(...flows)} cm/s of airflow.` };
  }
  return {
    thickness: s.thickness, airflow: s.airflow, ids: subset.map(r => r.id),
    stats: { tests: subset.length, notTracked: subset.filter(r => !r.spread).length, burnMin: Math.min(...burn), burnMax: Math.max(...burn), fastest, slowest },
    finding, caveat: 'Descriptive, not a safety rating. Sheet width, burning sides and oxygen also change between tests.'
  };
}

function canonicalFor(s) {
  const what = s.material.id === 'pmma' ? (s.thickness !== null ? `a ${s.thickness} mm acrylic sheet` : 'acrylic') : s.material.inline;
  const air = s.air.key === 'custom' ? `at ${s.air.o2}% oxygen and ${s.air.psi} psi` : AIRS[s.air.key].phrase;
  const flow = s.airflow === null ? '' : s.airflow === 0 ? ' with no airflow' : ` with ${s.airflow} cm/s of airflow`;
  return `Will ${what} burn ${s.mission.phrase} ${air}${flow}?`;
}

/** The single entry point behind GET /api/ask. */
export function ask(params = {}) {
  const s = resolveScenario(params);
  const checks = checksFor(s);
  const failed = checks.filter(c => !c.ok).map(c => c.key);
  const covered = failed.length === 0;
  const subset = subsetFor(s);
  const burn = subset.map(r => r.burnMin);

  const verdict = covered
    ? { state: 'burned', stamp: 'Burned', count: `${subset.length} of ${subset.length} tests`, headline: 'Yes. NASA watched it burn.',
        sub: (s.thickness === null ? `All ${subset.length} acrylic sheets in the BASS-II tests burned in orbit` : `All ${subset.length} of the ${s.thickness} mm sheets in the BASS-II tests burned in orbit`) +
          `, for ${Math.round(Math.min(...burn))} to ${Math.round(Math.max(...burn))} minutes each.` + (s.mission.id === 'transit' ? ' On this trip, Earth is months away.' : '') }
    : { state: 'no-data', stamp: 'No data', count: `0 of ${records.length} tests match`, headline: headlineFor(s, failed),
        sub: 'That is an answer too: NASA’s tests in this set don’t reach your cabin. Step 2 shows what would close the gap.' };

  const understood = [
    { field: 'Mission', value: s.mission.name, from: s.from.mission },
    { field: 'Cabin air', value: `${s.air.name} · ${s.air.psi} psi · ${s.air.o2}% O₂`, from: s.from.air },
    { field: 'Material', value: s.material.name, from: s.from.material },
    { field: 'Thickness', value: s.thickness === null ? 'All sheets' : `${s.thickness} mm`, from: s.from.thickness },
    { field: 'Airflow', value: s.airflow === null ? 'Any tested' : s.airflow === 0 ? 'Still air' : `${s.airflow} cm/s`, from: s.from.airflow }
  ];

  const gaps = covered ? [] : gapsFor(s, failed);
  const sources = [SOURCES.report, ...gaps.map(g => g.source)].filter((x, i, a) => a.findIndex(y => y.url === x.url) === i);

  return {
    question: params.q || '',
    canonical: canonicalFor(s),
    notices: s.parsed.notices,
    understood,
    scenario: { mission: s.mission, air: s.air, material: s.material, thickness: s.thickness, airflow: s.airflow },
    // Each tile's badge: how many tests match that mission with its own default air
    // and the current material, thickness and airflow. The selected tile uses the current air.
    missions: MISSIONS.map(m => {
      const alt = m.id === s.mission.id ? s : { ...s, mission: m, air: airFor(AIRS[m.air].psi, AIRS[m.air].o2) };
      const matches = checksFor(alt).every(c => c.ok) ? subsetFor(alt).length : 0;
      return { id: m.id, name: m.name, sub: m.sub, gText: m.gText, home: m.home, matches, selected: m.id === s.mission.id };
    }),
    checks, verdict,
    why: covered ? { lead: 'Passing on Earth isn’t proof for orbit.', text: 'Related BASS-II tests kept acrylic rods burning at 17% O₂ in orbit, below the 18% they needed on the ground.', source: SOURCES.gravityRods } : null,
    evidence: covered ? evidenceFor(s) : null,
    gaps, nearest: covered ? null : nearestFor(s, failed),
    envelope: ENVELOPE, sources
  };
}
