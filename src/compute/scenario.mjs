// Will It Burn? — turns a question (or tapped controls) into a cabin scenario,
// checks it against the envelope of the matching evidence set, and builds the answer.
// Every number returned here comes from data/ or from a cited source.
import { records, provenance } from './evidence.mjs';
import { FINDINGS } from './findings.mjs';
import { fabricTests, nomexTests, EXTINCTION } from './sets.mjs';
import { saffireRelated } from './saffire.mjs';

export class InputError extends Error {}

const KPA_PER_PSI = 6.894757;
const round1 = x => Math.round(x * 10) / 10;
const kpa = psi => round1(psi * KPA_PER_PSI);
const range = (a, b, unit = '') => a === b ? `${a}${unit}` : `${a}–${b}${unit}`;

export const SOURCES = {
  report: { name: 'NASA/TM-20210011385, Table 5.1, printed p. 57 (BASS-II)', url: provenance.source },
  fabric: { name: 'NASA/TM-20210011385, Table 7.1, printed p. 96 (BASS-II SIBAL fabric)', url: provenance.source },
  nomex: { name: 'NASA/TM-20210011385, Section 3.1.1 (p. 46) and Table A.2 (p. 105): the Nomex tests', url: provenance.source },
  extinction: { name: 'NASA/TM-20210011385, Table 2.1, printed p. 28 (extinction velocity)', url: provenance.source },
  gravityRods: { name: 'Scientific Reports (2018): The Effect of Gravity on Flame Spread over PMMA Cylinders', url: 'https://www.nature.com/articles/s41598-017-18398-4' },
  atmosphere: { name: 'NASA evidence report (2015): the 8.2 psia, 34% O₂ exploration atmosphere', url: 'https://ntrs.nasa.gov/citations/20150021491' },
  saffire: { name: 'NASA ICES-2024-365: Preliminary results from the Saffire VI experiment (Table 1)', url: 'https://ntrs.nasa.gov/citations/20240002981' },
  luci: { name: 'NASA (2025): Lunar Combustion Investigation (LUCI) on a spinning suborbital rocket', url: 'https://ntrs.nasa.gov/citations/20250010653' },
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

// Order matters: the first tested material mentioned wins, otherwise the first untested one.
// SIBAL `covers` cotton and fabric, so "cotton-fiberglass fabric" doesn't trigger a notice about them.
export const MATERIALS = [
  { id: 'pmma', name: 'Acrylic (PMMA) sheet', inline: 'acrylic', supported: true, re: /acrylic|pmma|plexi(?:glass)?|perspex|polymethyl/ },
  { id: 'sibal', name: 'SIBAL cotton-fibreglass fabric', inline: 'SIBAL fabric', supported: true, covers: ['cotton', 'fabric'], re: /sibal|cotton[- /]?fib(?:er|re)[- ]?glass/ },
  { id: 'nomex', name: 'Nomex III', inline: 'Nomex', supported: true, re: /nomex/ },
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

// What a set of rows covers. Derived from the data, never typed in. BASS and BASS-II both ran in
// the station's glovebox at about 1 atm, so every set shares the pressure note.
function envelopeOf({ o2, flows = null, thicknesses = null, summary }) {
  const o2Min = Math.min(...o2), o2Max = Math.max(...o2);
  return {
    gravity: 0, psi: 14.7, psiTolerance: 0.5,
    pressureNote: 'Pressure is not listed in the table. BASS-II ran in the station’s glovebox at about 1 atm.',
    o2Min, o2Max, po2Min: round1(kpa(14.7) * o2Min / 100), po2Max: round1(kpa(14.7) * o2Max / 100),
    flowMin: flows ? Math.min(...flows) : null, flowMax: flows ? Math.max(...flows) : null, thicknesses, summary
  };
}

// What the 20 BASS-II acrylic rows actually cover.
export const ENVELOPE = (() => {
  const thicknesses = [...new Set(records.map(r => r.thicknessMm))].sort((a, b) => a - b);
  const e = envelopeOf({ o2: records.flatMap(r => [r.oxygenInitial, r.oxygenFinal]), flows: records.flatMap(r => r.velocity), thicknesses });
  e.summary = `Microgravity aboard the ISS, about 14.7 psi, ${e.o2Min}–${e.o2Max}% O₂, ${e.flowMin}–${e.flowMax} cm/s of airflow against the flame, ${thicknesses[0]}–${thicknesses.at(-1)} mm acrylic sheets.`;
  return { ...e, material: 'pmma' };
})();

// One evidence set per tested material. Acrylic carries spread rates; fabric and Nomex carry outcomes.
const usedFabric = fabricTests.filter(t => t.outcome !== 'reused');
const fabricEnvelope = envelopeOf({ o2: usedFabric.map(t => t.oxygen), flows: usedFabric.flatMap(t => t.flow) });
fabricEnvelope.summary = `Microgravity aboard the ISS, about 14.7 psi, ${fabricEnvelope.o2Min}–${fabricEnvelope.o2Max}% O₂, ${fabricEnvelope.flowMin}–${fabricEnvelope.flowMax} cm/s of airflow running with the flame, SIBAL fabric strips ${[...new Set(usedFabric.map(t => t.widthMm / 10))].sort((a, b) => a - b).join(' and ')} cm wide.`;
const nomexEnvelope = envelopeOf({ o2: nomexTests.flatMap(t => [t.oxygenInitial, t.oxygenFinal]).filter(v => v !== null) });
nomexEnvelope.summary = `Microgravity aboard the ISS, about 14.7 psi, ${nomexEnvelope.o2Min}–${nomexEnvelope.o2Max}% O₂, airflow running with the flame (its speed isn’t given), ${nomexTests.length} Nomex III samples.`;

export const SETS = {
  pmma: { id: 'pmma', kind: 'spread', tested: 'Acrylic (PMMA)', envelope: ENVELOPE, rows: records, source: SOURCES.report },
  sibal: { id: 'sibal', kind: 'outcomes', tested: 'SIBAL fabric', envelope: fabricEnvelope, rows: usedFabric, excluded: fabricTests.length - usedFabric.length, source: SOURCES.fabric },
  nomex: { id: 'nomex', kind: 'outcomes', tested: 'Nomex III', envelope: nomexEnvelope, rows: nomexTests, excluded: 0, source: SOURCES.nomex }
};
// Untested materials are checked against the acrylic envelope, so the other rows still mean something.
const setFor = s => SETS[s.material.id] ?? SETS.pmma;

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
    const chosen = found.find(m => m.supported) ?? found[0];
    const others = found.filter(m => m !== chosen && !(chosen.covers || []).includes(m.id));
    fields.material = chosen.id;
    if (chosen.supported && others.length) notices.push(`This shows ${chosen.inline}, so ${others.map(m => m.inline).join(' and ')} ${others.length > 1 ? 'aren’t' : 'isn’t'} shown.`);
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
  const set = setFor(s), E = set.envelope;
  const checks = [
    { key: 'material', label: 'Material', yours: s.material.name.replace(' sheet', ''), tested: s.material.supported ? set.tested : Object.values(SETS).map(x => x.tested).join(', '), ok: s.material.supported },
    { key: 'gravity', label: 'Gravity', yours: s.mission.gText, tested: 'µg (ISS)', ok: s.mission.g === E.gravity },
    { key: 'oxygen', label: 'Oxygen', yours: `${s.air.o2}%`, tested: range(E.o2Min, E.o2Max, '%'), ok: s.air.o2 >= E.o2Min && s.air.o2 <= E.o2Max },
    { key: 'pressure', label: 'Pressure', yours: `${s.air.psi} psi`, tested: '≈14.7 psi', ok: Math.abs(s.air.psi - E.psi) <= E.psiTolerance, note: E.pressureNote }
  ];
  if (s.airflow !== null) checks.push({ key: 'airflow', label: 'Airflow', yours: s.airflow === 0 ? 'Still air' : `${s.airflow} cm/s`,
    tested: E.flowMin === null ? 'Not given in cm/s' : range(E.flowMin, E.flowMax, ' cm/s'), ok: E.flowMin !== null && s.airflow >= E.flowMin && s.airflow <= E.flowMax });
  if (s.thickness !== null) checks.push({ key: 'thickness', label: 'Thickness', yours: `${s.thickness} mm`,
    tested: E.thicknesses ? range(E.thicknesses[0], E.thicknesses.at(-1), ' mm') : 'Not recorded', ok: !!E.thicknesses && E.thicknesses.includes(s.thickness) });
  return checks;
}

function subsetFor(s) {
  const set = setFor(s);
  if (set.kind === 'spread') return records.filter(r => s.thickness === null || r.thicknessMm === s.thickness);
  return set.rows.filter(t => s.airflow === null || set.envelope.flowMin === null || (t.flowMin <= s.airflow && s.airflow <= t.flowMax));
}

function headlineFor(s, failed) {
  const E = setFor(s).envelope, first = failed[0];
  if (first === 'material') return `Unknown. There’s no ${s.material.inline} data in this set.`;
  if (first === 'gravity') return `Unknown. None of these tests felt ${s.mission.adj} gravity.`;
  if (first === 'oxygen') return s.air.o2 > E.o2Max ? `Unknown. These tests stopped at ${E.o2Max}% oxygen.` : `Unknown. These tests never went below ${E.o2Min}% oxygen.`;
  if (first === 'pressure') return 'Unknown. These tests only ran at station pressure.';
  if (first === 'airflow') return E.flowMin === null ? 'Unknown. These tests don’t give their airflow in cm/s.'
    : s.airflow === 0 ? 'Unknown. These tests never ran in still air.' : s.airflow < E.flowMin ? `Unknown. These tests never ran below ${E.flowMin} cm/s.` : `Unknown. These tests never ran above ${E.flowMax} cm/s.`;
  return E.thicknesses ? `Unknown. These tests only used ${E.thicknesses[0]}–${E.thicknesses.at(-1)} mm sheets.` : 'Unknown. These tests don’t record sample thickness.';
}

function gapsFor(s, failed) {
  const set = setFor(s), E = set.envelope, gaps = [], has = k => failed.includes(k);
  if (has('material')) gaps.push(['cotton', 'fabric'].includes(s.material.id)
    ? { topic: 'Material', text: 'The closest NASA data here is SIBAL, a cotton-fibreglass fabric blend that BASS-II burned in orbit. It isn’t pure cotton, so it can’t stand in for your fabric.', source: SOURCES.fabric }
    : s.material.id === 'silicone'
    ? { topic: 'Material', text: `${saffireRelated('silicone').text} Its oxygen is estimated from CO₂ and its airflow ran with the flame, so this app shows it beside the answer, not as one.`, source: saffireRelated('silicone').source }
    : { topic: 'Material', text: `This prototype holds NASA’s acrylic sheets, SIBAL fabric and Nomex tests. ${s.material.name} needs more NASA reports added to the corpus.`, source: SOURCES.report });
  if (has('gravity')) {
    gaps.push({ topic: 'Gravity', text: 'Partial gravity is barely tested. The first burns lasting more than 25 seconds in simulated lunar gravity were only reported in 2025, from a spinning suborbital rocket.', source: SOURCES.luci });
    gaps.push({ topic: 'Gravity', text: 'For acrylic rods, early drop-tower centrifuge results put lunar gravity near the worst case: it’s where the rods kept burning at the lowest oxygen.', source: SOURCES.partialGravity });
  }
  if (has('oxygen') || has('pressure')) {
    const inside = s.air.po2 >= E.po2Min && s.air.po2 <= E.po2Max;
    const n2Ratio = (s.air.kpa * (1 - s.air.o2 / 100)) / (kpa(14.7) * 0.79);
    const nitrogen = n2Ratio < 0.5 ? ' But it has less than half the nitrogen that soaks up a flame’s heat, so the ISS tests don’t stretch that far.'
      : n2Ratio < 0.9 ? ' But it has less nitrogen to soak up a flame’s heat, so the ISS tests don’t stretch that far.' : '';
    gaps.push(inside
      ? { topic: 'Oxygen & pressure', text: `Your cabin’s oxygen partial pressure, ${s.air.po2} kPa, sits inside the tested ${E.po2Min}–${E.po2Max} kPa.${nitrogen}`, source: SOURCES.atmosphere }
      : { topic: 'Oxygen & pressure', text: `Your cabin’s oxygen partial pressure, ${s.air.po2} kPa, is outside the tested ${E.po2Min}–${E.po2Max} kPa as well.`, source: set.source });
    if (s.air.o2 > E.o2Max || s.air.psi < E.psi - E.psiTolerance) gaps.push({ topic: 'Where the data is', text: 'Saffire V and VI burned samples at reduced pressure and raised oxygen inside uncrewed Cygnus ships: about 10 psi and 26% O₂ on V, and about 8 psi and 29–31% O₂ on VI. They are on our list to add.', source: SOURCES.saffire });
    if (!has('gravity')) gaps.push({ topic: 'Where the data is', text: 'SoFIE, in the station’s Combustion Integrated Rack, can test exploration atmospheres at reduced pressure.', source: SOURCES.sofie });
  }
  if (has('airflow')) {
    if (E.flowMin === null) gaps.push({ topic: 'Airflow', text: 'The report gives these tests’ airflow only as an instrument reading, not in cm/s, so it can’t be matched to yours.', source: set.source });
    else if (s.airflow < E.flowMin) {
      gaps.push({ topic: 'Airflow', text: `Still air is its own regime. With no flow, oxygen reaches a flame only by slow diffusion, and every one of these tests had at least ${E.flowMin} cm/s of airflow.`, source: SOURCES.candle });
      if (set.id === 'pmma') {
        const [hi, lo] = [...EXTINCTION].sort((a, b) => b.o2 - a.o2);
        gaps.push({ topic: 'Airflow', text: `In BASS-II’s thin-acrylic tests, flames went out once the opposing airflow fell below ${hi.experimentMmS / 10} ± ${hi.uncertaintyMmS / 10} cm/s at ${hi.o2}% O₂, and ${lo.experimentMmS / 10} ± ${lo.uncertaintyMmS / 10} cm/s at ${lo.o2}%. The report says that speed doesn’t depend on thickness.`, source: SOURCES.extinction });
      } else {
        const quenched = set.rows.filter(t => t.outcome === 'quenched').map(t => t.flowMin);
        if (quenched.length) gaps.push({ topic: 'Airflow', text: `In ${quenched.length} of these fabric tests, the flame went out as the airflow was turned down, at ${range(Math.min(...quenched), Math.max(...quenched), ' cm/s')}.`, source: set.source });
      }
    } else gaps.push({ topic: 'Airflow', text: `Flows above ${E.flowMax} cm/s weren’t tested in this set.`, source: set.source });
  }
  if (has('thickness')) gaps.push(E.thicknesses
    ? { topic: 'Thickness', text: `BASS-II tested ${E.thicknesses.join(', ')} mm sheets. Thinner sheets spread faster in these tests, so the data doesn’t support stretching it to ${s.thickness} mm.`, source: SOURCES.report }
    : { topic: 'Thickness', text: 'The report doesn’t record these samples’ thickness, so no thickness can be matched.', source: set.source });
  return gaps;
}

function nearestFor(s, failed) {
  const params = {}, changes = [];
  if (failed.includes('material')) {
    params.material = ['cotton', 'fabric'].includes(s.material.id) ? 'sibal' : 'pmma';
    changes.push(params.material === 'sibal' ? 'SIBAL fabric' : 'acrylic');
  }
  if (failed.includes('gravity')) { params.mission = 'iss'; params.air = 'earth'; changes.push('the ISS', 'Earth-normal air'); }
  else if (failed.includes('oxygen') || failed.includes('pressure')) { params.air = 'earth'; changes.push('Earth-normal air'); }
  if (failed.includes('airflow')) { params.airflow = 'none'; changes.push('any tested airflow'); }
  if (failed.includes('thickness')) {
    const T = (SETS[params.material ?? s.material.id] ?? SETS.pmma).envelope.thicknesses;
    if (T) { const near = T.reduce((a, b) => Math.abs(b - s.thickness) < Math.abs(a - s.thickness) ? b : a); params.thickness = near; changes.push(`${near} mm sheets`); }
    else { params.thickness = 'all'; changes.push('any thickness'); }
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
    kind: 'spread', thickness: s.thickness, airflow: s.airflow, ids: subset.map(r => r.id),
    stats: { tests: subset.length, notTracked: subset.filter(r => !r.spread).length, burnMin: Math.min(...burn), burnMax: Math.max(...burn), fastest, slowest },
    finding, caveat: 'Descriptive, not a safety rating. Sheet width, burning sides and oxygen also change between tests.'
  };
}

// What happened to each fabric or Nomex sample, in words, from the report's own comment or note.
const HAPPENED = {
  burned: 'Burned', quenched: 'Burned, then went out as the airflow was turned down', blowoff: 'Burned, then blew out as the airflow was turned up',
  'no-ignition': 'Didn’t ignite'
};

function outcomesFor(s) {
  const set = setFor(s), tests = subsetFor(s);
  const count = o => tests.filter(t => t.outcome === o).length;
  const noIgnition = count('no-ignition');
  const rows = tests.map(t => set.id === 'nomex'
    ? { id: t.id, date: t.date, flowText: `air display ${t.airDisplay}`, oxygenText: t.oxygenFinal === null ? `${t.oxygenInitial}% → not read` : `${t.oxygenInitial}% → ${t.oxygenFinal}%`, happened: t.notes, sourceLocation: t.sourceLocation }
    : { id: t.id, width: `${t.widthMm / 10} cm`, flowText: `${t.flowText} cm/s`, oxygenText: `${t.oxygen}%${t.oxygenNote ? '*' : ''}`, happened: HAPPENED[t.outcome], sourceLocation: t.sourceLocation, oxygen: t.oxygen, outcome: t.outcome });
  const finding = set.id === 'nomex'
    ? { lead: 'The report:', text: '“The three Nomex® samples did not ignite …” Each row shows the test’s own note.' }
    : { lead: 'The report found:', text: '“Flames spread more slowly across the narrower samples, at lower flow velocities and at lower O2 percentages.” (p. 95)' };
  const caveat = set.id === 'nomex'
    ? 'Descriptive, not a safety rating. The airflow ran with the flame, and the report gives its speed only as an instrument reading.'
    : `Descriptive, not a safety rating. The airflow in these tests ran with the flame, not against it as in the acrylic tests. ${set.excluded} reused samples are left out, as the report does. * The report says this O₂ reading might be inaccurate.`;
  return { kind: 'outcomes', set: set.id, label: set.tested, airflow: s.airflow, ids: tests.map(t => t.id), tests: rows,
    counts: { tests: tests.length, ignited: tests.length - noIgnition, quenched: count('quenched'), blowoff: count('blowoff'), noIgnition },
    finding, caveat, source: set.source };
}

function outcomeVerdict(ev, E) {
  const { tests: n, ignited, quenched, blowoff, noIgnition } = ev.counts;
  const events = [quenched && `${quenched} went out as the airflow was turned down`, blowoff && `${blowoff} blew out as it was turned up`].filter(Boolean);
  const eventText = events.length ? ` ${events.join(', and ')}.` : '';
  if (ignited === n) return { state: 'burned', stamp: 'Burned', count: `${n} of ${n} tests`, headline: 'Yes. NASA watched it burn.', sub: `All ${n} ${ev.label} tests here burned in orbit.${eventText}` };
  if (ignited === 0) return { state: 'no-burn', stamp: 'No flame held', count: `0 of ${n} tests`, headline: `Not in NASA’s tests. No flame held on it in ${n} tries.`,
    sub: `That isn’t a safety rating: ${n} small samples, one igniter, airflow running with the flame and ${range(E.o2Min, E.o2Max, '% oxygen')} are all that was tested.` };
  const o2 = ev.tests.filter(t => t.outcome === 'no-ignition').map(t => t.oxygen);
  return { state: 'mixed', stamp: 'Mixed', count: `${ignited} of ${n} tests burned`, headline: `Sometimes. NASA saw it burn in ${ignited} of ${n} tests.`,
    sub: `The ${noIgnition} that didn’t ignite were at ${range(Math.min(...o2), Math.max(...o2), '%')} oxygen.${eventText}` };
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
  const set = setFor(s);
  const checks = checksFor(s);
  const failed = checks.filter(c => !c.ok).map(c => c.key);
  const covered = failed.length === 0;
  const subset = subsetFor(s);
  const burn = subset.map(r => r.burnMin);
  const evidence = !covered ? null : set.kind === 'spread' ? evidenceFor(s) : outcomesFor(s);

  const verdict = !covered
    ? { state: 'no-data', stamp: 'No data', count: `0 of ${set.rows.length} tests match`, headline: headlineFor(s, failed),
        sub: 'That is an answer too: NASA’s tests in this set don’t reach your cabin. Each gap says what is missing and where data may exist.' }
    : set.kind === 'outcomes' ? outcomeVerdict(evidence, set.envelope)
    : { state: 'burned', stamp: 'Burned', count: `${subset.length} of ${subset.length} tests`, headline: 'Yes. NASA watched it burn.',
        sub: (s.thickness === null ? `All ${subset.length} acrylic sheets in the BASS-II tests burned in orbit` : `All ${subset.length} of the ${s.thickness} mm sheets in the BASS-II tests burned in orbit`) +
          `, for ${Math.round(Math.min(...burn))} to ${Math.round(Math.max(...burn))} minutes each.` + (s.mission.id === 'transit' ? ' On this trip, Earth is months away.' : '') };

  const understood = [
    { field: 'Mission', value: s.mission.name, from: s.from.mission },
    { field: 'Cabin air', value: `${s.air.name} · ${s.air.psi} psi · ${s.air.o2}% O₂`, from: s.from.air },
    { field: 'Material', value: s.material.name, from: s.from.material },
    { field: 'Thickness', value: s.thickness === null ? 'All sheets' : `${s.thickness} mm`, from: s.from.thickness },
    { field: 'Airflow', value: s.airflow === null ? 'Any tested' : s.airflow === 0 ? 'Still air' : `${s.airflow} cm/s`, from: s.from.airflow }
  ];

  const gaps = covered ? [] : gapsFor(s, failed);
  const sources = [set.source, ...gaps.map(g => g.source)].filter((x, i, a) => a.findIndex(y => y.url === x.url && y.name === x.name) === i);

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
    why: covered && set.id === 'pmma' ? { lead: 'Passing on Earth isn’t proof for orbit.', text: 'Related BASS-II tests kept acrylic rods burning at 17% O₂ in orbit. On the ground, rods of the same sizes couldn’t keep a flame at 18% or below.', source: SOURCES.gravityRods } : null,
    evidence,
    // Ranked over all 20 acrylic tests, and shown only when those tests cover the cabin.
    findings: covered && set.id === 'pmma' ? FINDINGS : null,
    // Saffire-II sits beside the answer, never inside it: a separate rig, flow direction and O₂ method.
    related: covered ? saffireRelated(set.id) : null,
    gaps, nearest: covered ? null : nearestFor(s, failed),
    envelope: set.envelope, sources
  };
}
