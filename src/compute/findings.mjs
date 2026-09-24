// Ranked findings: what the BASS-II rows show, ordered by how consistently matched comparisons agree.
// A comparison pairs two measured spreads that match on every listed condition except the one compared.
// Counts, exceptions and caveats all come from the rows. Descriptive only: no causal claim, no safety ranking.
import { records } from './evidence.mjs';

export const TIERS = { consistent: 'Consistent', suggestive: 'Suggestive', mixed: 'Mixed', 'too-few': 'Too few tests' };
export const RULE = 'Consistent: 10 or more comparisons, at least 85% agreeing. Suggestive: 4 or more, at least 75%. Mixed: 4 or more, under 75%. Too few tests: under 4.';

export function tierFor(n, agree) {
  if (n >= 10 && agree / n >= 0.85) return 'consistent';
  if (n >= 4) return agree / n >= 0.75 ? 'suggestive' : 'mixed';
  return 'too-few';
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const list = xs => xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;
const byId = (a, b) => a.localeCompare(b, 'en', { numeric: true });
const idsOf = pairs => [...new Set(pairs.flatMap(p => [p.a.id, p.b.id]))].sort(byId);
const order = v => v.every((x, i) => i === 0 || x < v[i - 1]) ? 'down' : v.every((x, i) => i === 0 || x > v[i - 1]) ? 'up' : 'mixed';

// Each factor: the condition that varies, the conditions that must match, and the side its lead expects to spread faster.
const FACTORS = [
  { key: 'airflow', topic: 'Airflow.', lead: 'More airflow, faster spread.', varies: 'velocity', matched: [], sameTest: true, favoured: (p, q) => p.velocity > q.velocity,
    text: (n, a, t) => `Within a test, the faster airflow had the faster spread in ${a} of ${plural(n, 'comparison')}, across ${plural(t, 'test')}.` },
  { key: 'thickness', topic: 'Thickness.', lead: 'Thinner sheets, faster spread.', varies: 'thickness', matched: ['width', 'sides', 'velocity'], favoured: (p, q) => p.thickness < q.thickness, other: 'thicker sheet',
    text: (n, a) => `Between tests with the same width, burning sides and airflow, the thinner sheet spread faster in ${a} of ${plural(n, 'comparison')}.` },
  { key: 'width', topic: 'Width.', lead: 'Wider sheets, faster spread.', varies: 'width', matched: ['thickness', 'sides', 'velocity'], favoured: (p, q) => p.width > q.width, other: 'narrower sheet',
    text: (n, a) => `Between tests with the same thickness, burning sides and airflow, the wider sheet spread faster in ${a} of ${plural(n, 'comparison')}.` },
  { key: 'oxygen', topic: 'Oxygen.', lead: 'More oxygen, faster spread.', varies: 'oxygen', matched: ['thickness', 'width', 'sides', 'velocity'], favoured: (p, q) => p.oxygen > q.oxygen,
    text: (n, a) => `Between tests with the same thickness, width, burning sides and airflow, the one with more starting oxygen spread faster in ${a} of ${plural(n, 'comparison')}.` },
  { key: 'sides', topic: 'Burning sides.', lead: 'Two burning sides, faster spread.', varies: 'sides', matched: ['thickness', 'width', 'velocity'], favoured: (p, q) => p.sides > q.sides, other: 'one-sided sheet',
    text: (n, a) => `Between tests with the same thickness, width and airflow, the two-sided sheet spread faster in ${a} of ${plural(n, 'comparison')}.` }
];

// Every tracked (airflow, spread) reading, with the conditions of its test. Untracked spreads never appear.
const points = rs => rs.flatMap(r => (r.spread || []).map((spread, i) => ({ id: r.id, velocity: r.velocity[i], spread,
  thickness: r.thicknessMm, width: r.widthMm, sides: r.burningSides, oxygen: r.oxygenInitial })));

function pairsFor(f, pts) {
  const pairs = [];
  pts.forEach((p, i) => pts.slice(i + 1).forEach(q => {
    if ((p.id === q.id) !== !!f.sameTest || p[f.varies] === q[f.varies] || f.matched.some(k => p[k] !== q[k])) return;
    const [a, b] = f.favoured(p, q) ? [p, q] : [q, p];   // a is the side the lead expects to spread faster
    pairs.push({ a, b, agrees: a.spread > b.spread });
  }));
  return pairs;
}

function caveatFor(f, pairs, rs) {
  const misses = pairs.filter(p => !p.agrees), o2Fell = rs.every(r => r.oxygenFinal < r.oxygenInitial);
  if (f.key === 'airflow') {
    const exceptions = idsOf(misses);
    const notDown = rs.filter(r => r.spread?.length > 1 && order(r.velocity) !== 'down');
    let text = `Airflow wasn’t varied on its own. ${o2Fell ? 'Oxygen fell during every test, and the table' : 'The table'} gives only start and end oxygen, so it can’t separate airflow from falling oxygen.`;
    if (exceptions.length && exceptions.join() === notDown.map(r => r.id).sort(byId).join() && notDown.every(r => order(r.velocity) === 'up'))
      text += exceptions.length === 1 ? ` The one exception, ${exceptions[0]}, is also the only test listed from low to high flow.`
        : ` The exceptions, ${list(exceptions)}, are also the only tests listed from low to high flow.`;
    else if (exceptions.length) text += ` Exceptions: ${list(exceptions)}.`;
    return text;
  }
  if (f.key === 'oxygen') return `Uses each test’s starting oxygen${o2Fell ? ', which fell during every test' : ''}.`;
  const base = 'These are different tests, so oxygen differs between them.';
  if (!misses.length || !misses.every(p => p.b.oxygen > p.a.oxygen)) return base;
  return `${base} ${misses.length === 1 ? 'The one exception' : `All ${misses.length} exceptions`} had more starting oxygen on the ${f.other}.`;
}

/** Ranks every factor by tier, then by the share of comparisons that agree, then by how many there are. */
export function rankFindings(rs = records) {
  const pts = points(rs), tiers = Object.keys(TIERS), share = f => f.comparisons ? f.agree / f.comparisons : 0;
  const found = FACTORS.map(f => {
    const pairs = pairsFor(f, pts), n = pairs.length, agree = pairs.filter(p => p.agrees).length, tier = tierFor(n, agree), ids = idsOf(pairs);
    const side = p => ({ id: p.id, velocity: p.velocity, spread: p.spread, [f.varies]: p[f.varies] });
    return { key: f.key, tier, tierLabel: TIERS[tier], lead: tier === 'consistent' || tier === 'suggestive' ? f.lead : f.topic,
      text: n ? f.text(n, agree, ids.length) : 'No matched comparisons in these tests.', caveat: caveatFor(f, pairs, rs),
      comparisons: n, agree, ids, exceptions: idsOf(pairs.filter(p => !p.agrees)),
      pairs: pairs.map(p => ({ expected: side(p.a), other: side(p.b), agrees: p.agrees })) };
  });
  const untracked = rs.filter(r => !r.spread).map(r => r.id);
  return {
    tests: rs.length,
    method: 'A comparison pairs two measured spreads that match on every listed condition except the one being compared.' +
      (untracked.length ? ` ${list(untracked)} ${untracked.length === 1 ? 'has no tracked spread, so it is' : 'have no tracked spread, so they are'} left out, never counted as zero.` : ''),
    rule: RULE,
    caveat: 'Descriptive, not causal, and not a safety ranking. All rows come from one NASA investigation, so they are not independent studies.',
    ranked: found.sort((x, y) => tiers.indexOf(x.tier) - tiers.indexOf(y.tier) || share(y) - share(x) || y.comparisons - x.comparisons)
      .map((f, i) => ({ rank: i + 1, ...f }))
  };
}

export const FINDINGS = rankFindings();
