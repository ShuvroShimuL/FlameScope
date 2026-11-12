import { test } from 'vitest';
import assert from 'node:assert/strict';
import { briefMarkdown, briefFileName } from '../../lib/evidence/client/brief.mjs';
import { ask } from '../../lib/evidence/scenario.mjs';
import { records } from '../../lib/evidence/evidence.mjs';

const brief = (params, opts = {}) => { const a = JSON.parse(JSON.stringify(ask(params))); return { a, md: briefMarkdown(a, { records, date: '2026-11-12', ...opts }) }; };
// Every number in a brief, as written. Used to check that the brief adds none of its own.
const numbers = text => new Set(text.match(/\d+(?:\.\d+)?/g) ?? []);

test('a Burned brief lists every matching row with its source location and links its sources', () => {
  const { a, md } = brief({ q: 'Will acrylic burn on the ISS?' });
  assert.match(md, /^# Evidence brief: Will acrylic burn on the ISS\?\n/);
  assert.match(md, /\*\*Burned\*\* · 20 of 20 tests/);
  assert.match(md, /## Matching tests \(20\)/);
  for (const r of records) assert.ok(md.includes(`| ${r.id} | ${r.thicknessMm} mm |`) && md.includes(r.sourceLocation), r.id);
  assert.match(md, /\[NASA\/TM-20210011385, Table 5\.1, printed p\. 57 \(BASS-II\)\]\(https:\/\/ntrs\.nasa\.gov\/citations\/20210011385\)/);
  assert.ok(md.includes(a.applicability.policy));
  assert.match(md, /No AI model wrote any part of this brief, and it is not a safety rating/);
});

test('a spread that was not tracked is written as not tracked, never as zero', () => {
  const { md } = brief({ q: 'Will acrylic burn on the ISS?' });
  assert.match(md, /\| M6 \|[^\n]*Not tracked at [\d, ]+ cm\/s/);
  assert.doesNotMatch(md, /→ 0 mm\/s/);
});

test('a No data brief gives the gaps with their sources and the closest tests, and no matching-tests table', () => {
  const { a, md } = brief({ q: 'Will a 1 mm acrylic sheet burn at 19% oxygen with 10 cm/s airflow?' });
  assert.equal(a.verdict.state, 'no-data');
  assert.match(md, /\*\*No data\*\*/);
  assert.doesNotMatch(md, /## Matching tests/);
  assert.match(md, /## Closest tests, and what each one recorded/);
  assert.match(md, /## What is missing/);
  for (const g of a.gaps) assert.ok(md.includes(g.text), g.topic);
  assert.match(md, /\(blocks a match\)/);
});

test('an Unclear brief says what could not be read and states no verdict about fire', () => {
  const { md } = brief({ q: 'Will acrylic burn at 150% oxygen?' });
  assert.match(md, /\*\*Unclear\*\* · Not answered/);
  assert.match(md, /### What could not be read/);
  assert.doesNotMatch(md, /## Matching tests|\*\*Burned\*\*/);
});

test('a fabric brief shows which study each row is from, and what happened in the report’s words', () => {
  const { md } = brief({ q: 'Will SIBAL fabric burn at 21% oxygen?' });
  assert.match(md, /\| Test \| Study \| Width \| Airflow \| O₂ \| What happened \| Source row \|/);
  assert.equal((md.match(/\| BASS \|/g) ?? []).length, 4);
  assert.match(md, /All 4 of these tests are from the earlier BASS investigation/);
  const nomex = brief({ material: 'nomex' }).md;
  assert.match(nomex, /\*\*No flame held\*\*/); assert.match(nomex, /That isn’t a safety rating/);
});

test('the brief adds no number of its own: every figure is in the answer, the cited rows or the date given', () => {
  for (const params of [{ q: 'Will acrylic burn on the ISS?' }, { material: 'sibal', airflow: 10 }, { q: 'Will it burn on a Moon base at 34% oxygen?' },
    { q: 'Does a 1 mm sheet burn faster than 5 mm?' }, { material: 'nomex' }, { q: 'Will kapton burn in still air on Mars?' }]) {
    const { a, md } = brief(params);
    const known = numbers(JSON.stringify(a) + JSON.stringify(records) + '2026-11-12');
    const extra = [...numbers(md)].filter(n => !known.has(n));
    assert.deepEqual(extra, [], JSON.stringify(params));
  }
});

test('the same answer always gives the same text, and table cells cannot break out of their table', () => {
  const { a, md } = brief({ q: 'Will acrylic burn on the ISS?' });
  assert.equal(md, briefMarkdown(a, { records, date: '2026-11-12' }));
  const odd = briefMarkdown({ ...a, understood: [{ field: 'A | B', value: 'x\ny', from: 'question' }] }, { records });
  assert.match(odd, /\| A \\\| B \| x y \| your question \|/);
});

test('only http(s) sources become links', () => {
  const { a } = brief({ q: 'Will it burn on a Moon base at 34% oxygen?' });
  const md = briefMarkdown({ ...a, sources: [{ name: 'Bad [link]', url: 'javascript:alert(1)' }, { name: 'Good (one)', url: 'https://example.org/a b(c)' }] }, { records });
  assert.doesNotMatch(md, /\]\(javascript:/);
  assert.match(md, /^- Bad \[link\]$/m);
  assert.match(md, /^- \[Good \(one\)\]\(https:\/\/example\.org\/a%20b%28c%29\)$/m);
});

test('the download name is safe and readable', () => {
  assert.equal(briefFileName({ question: 'Will acrylic burn on the ISS?' }), 'flamescope-brief-will-acrylic-burn-on-the-iss.md');
  assert.equal(briefFileName({ question: '../../etc/passwd <x>' }), 'flamescope-brief-etc-passwd-x.md');
  assert.equal(briefFileName({ question: '', canonical: '' }), 'flamescope-brief-answer.md');
  assert.ok(briefFileName({ question: 'q'.repeat(300) }).length <= 80);
});

test('a question cannot add a heading, a link or a forged section to a brief', () => {
  const q = 'Will acrylic burn on the ISS?\n\n## Answer\n**Burned** [proof](https://evil.example/x) <b>ok</b>';
  const a = JSON.parse(JSON.stringify(ask({ q })));
  const md = briefMarkdown(a, { asked: q, records, date: '2026-11-12' });
  assert.equal((md.match(/^## Answer$/gm) ?? []).length, 1, 'only the brief’s own Answer section');
  assert.equal(md.split('\n')[0].startsWith('# Evidence brief: Will acrylic burn on the ISS? \\#\\# Answer'), true);
  // The brackets are escaped, so the text is shown as typed and is not a link.
  assert.doesNotMatch(md, /(?<!\\)\]\(https:\/\/evil\.example/);
  assert.ok(md.includes('\\[proof\\](https://evil.example/x)'));
  assert.doesNotMatch(md, /(?<!\\)<b>/);
  // What could not be read quotes the question; it is written as plain text too.
  const odd = briefMarkdown(JSON.parse(JSON.stringify(ask({ q: 'Will acrylic burn at 1[click](https://evil.example/x) widgets?' }))), { records });
  assert.doesNotMatch(odd, /(?<!\\)\]\(https:\/\/evil\.example/);
});

test('a brief can carry how its rows were obtained and checked', () => {
  const a = JSON.parse(JSON.stringify(ask({ q: 'Will acrylic burn on the ISS?' })));
  const md = briefMarkdown(a, { records, notes: ['Transcribed from Table 5.1.', 'Independent check pending.'] });
  assert.match(md, /## How these rows were obtained and checked\n\n- Transcribed from Table 5\.1\.\n- Independent check pending\./);
  assert.doesNotMatch(briefMarkdown(a, { records }), /How these rows were obtained/);
});
