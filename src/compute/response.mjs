// NASA's ISS fire response, quoted in NASA's order, with the microgravity evidence for each step.
// The steps come from data/fire-response.json and are never reworded, reordered or ranked here.
// One evidence line is computed from the BASS-II rows, so it can't drift from the ranked findings.
import { readFileSync } from 'node:fs';
import { FINDINGS } from './findings.mjs';
import { ENVELOPE, SOURCES } from './scenario.mjs';

const doc = JSON.parse(readFileSync(new URL('../../data/fire-response.json', import.meta.url)));

// How much microgravity evidence stands behind a step. It describes the evidence, never the step's importance.
export const STATUS = { one: 'One test', mixed: 'Mixed evidence', reason: 'Supports why', related: 'Related test only', none: 'No data found' };

function computed(key) {
  if (key !== 'bassIIAirflow') throw Error(`Unknown computed evidence: ${key}`);
  const a = FINDINGS.ranked.find(f => f.key === 'airflow');
  return { text: `This app’s ${FINDINGS.tests} BASS-II tests: the faster airflow had the faster spread in ${a.agree} of ${a.comparisons} comparisons, but the table can’t separate airflow from falling oxygen. No test ran below ${ENVELOPE.flowMin} cm/s, so they say nothing about still air.`,
    source: { ...SOURCES.report, label: 'BASS-II Table 5.1' } };
}

function cite(key) {
  if (key === null) return null;
  if (!doc.sources[key]) throw Error(`Unknown source: ${key}`);
  return doc.sources[key];
}

export const FIRE_RESPONSE = {
  title: doc.title, source: doc.source, method: doc.method, verification: doc.verification, limitations: doc.limitations,
  steps: doc.steps.map((s, i) => {
    if (s.n !== i + 1) throw Error(`Step ${s.n} is out of NASA's order`);
    if (!STATUS[s.status]) throw Error(`Unknown status: ${s.status}`);
    return { n: s.n, step: s.step, detail: s.detail ?? null, status: s.status, statusLabel: STATUS[s.status],
      evidence: s.evidence.map(e => e.computed ? computed(e.computed) : { text: e.text, source: cite(e.source) }),
      differs: s.differs ? { text: s.differs.text, source: cite(s.differs.source) } : null };
  })
};
