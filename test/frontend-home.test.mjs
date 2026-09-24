import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createController, paramsFrom, applyPatch, baseFrom, askedFor, verdictView } from '../web/state.js';
import { ask } from '../src/compute/scenario.mjs';
import { createServer } from '../src/api/server.mjs';

// The home page's request logic, run against real /api/ask answers with a network we control.
function harness() {
  const pending = [], answers = [], errors = [];
  const controller = createController({
    request: params => new Promise((resolve, reject) => pending.push({ params, resolve: () => resolve(JSON.parse(JSON.stringify(ask(params)))), reject })),
    onAnswer: (data, meta) => answers.push({ data, meta }),
    onError: (error, meta) => errors.push({ error, meta })
  });
  return { controller, pending, answers, errors };
}
const tick = () => new Promise(r => setImmediate(r));

test('Moon then Nomex, tapped quickly, keeps the Moon: each tap builds on the newest intent', async () => {
  const h = harness();
  h.controller.ask('Will acrylic burn on the ISS?'); h.pending[0].resolve(); await tick();
  h.controller.change({ mission: 'moon' });
  h.controller.change({ material: 'nomex', thickness: 'all' });   // before the Moon answer arrives
  assert.equal(h.pending.length, 3);
  assert.equal(h.pending[2].params.mission, 'moon'); assert.equal(h.pending[2].params.material, 'nomex');
  // Replies arrive out of order: the newest wins, and the older one is dropped.
  h.pending[2].resolve(); await tick();
  h.pending[1].resolve(); await tick();
  const last = h.answers.at(-1).data;
  assert.equal(h.answers.length, 2);
  assert.equal(last.scenario.mission.id, 'moon'); assert.equal(last.scenario.material.id, 'nomex');
});

test('a tap made while a typed question is still being read applies to that question', async () => {
  const h = harness();
  h.controller.ask('Will acrylic burn on the ISS at 21% oxygen?');
  h.controller.change({ thickness: 1 });
  assert.equal(h.pending.length, 1, 'the tap waits for the question');
  h.pending[0].resolve(); await tick();
  assert.equal(h.answers.length, 0, 'the half-applied answer is never shown');
  assert.deepEqual([h.pending[1].params.o2, h.pending[1].params.thickness], [21, 1], 'the tap keeps the oxygen the question gave');
  h.pending[1].resolve(); await tick();
  assert.equal(h.answers.length, 1); assert.equal(h.answers[0].meta.kind, 'tap');
});

test('a failed question is reported against that question, and a late older reply can’t take its place', async () => {
  const h = harness();
  h.controller.ask('first question');
  h.controller.ask('second question');
  h.pending[1].reject(new Error('Keep the question under 500 characters.')); await tick();
  assert.equal(h.errors.length, 1); assert.equal(h.errors[0].meta.question, 'second question');
  h.pending[0].resolve(); await tick();
  assert.equal(h.answers.length, 0, 'the older reply is dropped');
});

test('the scenario round-trips as explicit params, and a tap resets only what it replaces', () => {
  const r = ask({ q: 'Will a 1 mm steel sheet burn on Venus at 30% oxygen and 10 psi with 5 cm/s airflow?' });
  const p = paramsFrom(r.scenario);
  assert.deepEqual(p, { mission: 'other', material: 'other', air: 'earth', thickness: 1, width: 'all', airflow: 5, place: 'Venus', materialName: 'steel', o2: 30, psi: 10 });
  assert.deepEqual(ask(p).scenario, r.scenario, 'the same scenario comes back');
  const moon = applyPatch(p, { mission: 'moon' });
  assert.deepEqual([moon.o2, moon.psi, moon.air, moon.place], [undefined, undefined, undefined, undefined]);
  assert.equal(applyPatch(p, { material: 'pmma' }).materialName, undefined);
});

test('after an Unclear answer, a tap sends the question again: only a tap that replaces the unreadable part answers', async () => {
  // The review case: an unreadable airflow, then an ordinary mission tap, used to come back Burned for a 3 mm sheet.
  const q = 'Will it burn with a flow of 0.3 cm against it?';
  const h = harness();
  h.controller.ask(q); h.pending[0].resolve(); await tick();
  assert.equal(h.answers.at(-1).data.verdict.state, 'unresolved');
  h.controller.change({ mission: 'transit' });
  assert.deepEqual(h.pending[1].params, { q, mission: 'transit' }, 'nothing read from the unclear question travels as a trusted param');
  h.pending[1].resolve(); await tick();
  const after = h.answers.at(-1).data;
  assert.equal(after.verdict.state, 'unresolved', 'a mission tap doesn’t replace an airflow, so there is still no answer');
  assert.equal(after.canonical, q, 'the question stays on screen');

  // A tap that replaces the unreadable part answers, and later taps build on it.
  const k = harness();
  k.controller.ask('Will a -1 mm acrylic sheet burn on the ISS?'); k.pending[0].resolve(); await tick();
  assert.match(k.answers.at(-1).data.verdict.sub, /tap a thickness/);
  const unclear = k.answers.at(-1).data;
  assert.deepEqual(unclear.understood.filter(u => u.field === 'Thickness').map(u => u.value), ['Unclear'], 'no default chip beside the unclear one');
  k.controller.change({ thickness: '5' }); k.pending[1].resolve(); await tick();
  const answered = k.answers.at(-1);
  assert.equal(answered.data.verdict.state, 'burned'); assert.equal(answered.data.scenario.thickness, 5);
  assert.equal(askedFor(answered.data, answered.meta), 'Will a 5 mm acrylic sheet burn on the ISS in Earth-normal air?',
    'the answer is labelled with the question it answers, not the unclear one it replaced');
  k.controller.change({ mission: 'moon' }); k.pending[2].resolve(); await tick();
  const moon = k.answers.at(-1).data;
  assert.deepEqual([moon.scenario.mission.id, moon.scenario.thickness, moon.verdict.state], ['moon', 5, 'no-data']);
});

test('an Unclear question with an unrecorded condition keeps it in the question, and the nearest evidence still lands', async () => {
  const h = harness();
  h.controller.ask('Will a -1 mm acrylic sheet burn on the ISS at 25 °C?'); h.pending[0].resolve(); await tick();
  assert.equal(h.answers.at(-1).data.verdict.state, 'unresolved');
  h.controller.change({ thickness: '5' }); h.pending[1].resolve(); await tick();
  const gap = h.answers.at(-1);
  assert.equal(gap.data.verdict.state, 'no-data', 'the temperature no table records still blocks a yes');
  assert.match(askedFor(gap.data, gap.meta), /5 mm acrylic sheet .* at 25 °C\?$/, 'the question on screen keeps the condition the answer used');
  assert.equal(ask({ q: gap.data.canonical }).verdict.state, 'no-data', 'and asking it again gives the same answer');
  h.controller.change(gap.data.nearest.params); h.pending[2].resolve(); await tick();
  assert.equal(h.answers.at(-1).data.verdict.state, 'burned', `${gap.data.nearest.changes} lands on matching tests`);
});

test('a tap builds on an answered scenario only when the question behind it was read', () => {
  assert.equal(baseFrom(null), null);
  assert.deepEqual(baseFrom(ask({ q: 'Will a 3 acrylic sheet burn?' })), { q: 'Will a 3 acrylic sheet burn?' });
  assert.equal(baseFrom(ask({ q: 'Will a 3 mm acrylic sheet burn?' })).thickness, 3);
});

test('only matched evidence gets a confident flame; everything else is a dashed outline', () => {
  const view = q => verdictView(ask({ q }));
  assert.deepEqual(view('Will acrylic burn on the ISS?').flame, { g: 0, known: true, lit: true });
  const gap = view('Will acrylic burn on the ISS in exploration air?');
  assert.deepEqual([gap.stampClass, gap.flame.known, gap.shapeNote], ['gap', false, true], 'no data at µg must not draw a lit sphere');
  assert.match(gap.caption, /dashed outline/);
  assert.deepEqual(view('Will acrylic burn on Earth?').flame, { g: 1, known: false, lit: true });
  assert.deepEqual(view('Is Nomex safe on the ISS?').flame.lit, false);
  assert.equal(view('acrylic at 150% oxygen').stampClass, 'unclear');
});

test('the page opens in a neutral state, not with a verdict', async () => {
  const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
  const stamp = html.match(/<div class="stamp ([^"]+)" id="stamp">(.*?)<\/div>/);
  assert.equal(stamp[1], 'loading'); assert.doesNotMatch(stamp[2], /Burned|No data|Mixed/);
  assert.match(html, /id="answering"/);
  const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/state.js`);
    assert.equal(res.status, 200); assert.match(res.headers.get('content-type'), /javascript/);
  } finally { await new Promise(r => server.close(r)); }
});
