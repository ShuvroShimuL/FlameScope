import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuestionLibrary, LIBRARY_KEY, LIBRARY_LIMIT } from '../web/library.js';
import { createController, askedFor } from '../web/state.js';
import { ask } from '../src/compute/scenario.mjs';

function storage() {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
const make = (store = storage()) => { let t = 1000; return createQuestionLibrary(store, { now: () => ++t }); };

test('FR-22: questions persist across visits, retain exact requests and deduplicate in newest-first order', () => {
  const store = storage(), library = make(store);
  library.record('Acrylic at 16.8% oxygen', { q: 'Acrylic at 16.8% oxygen', thickness: 1, airflow: 21 });
  library.record('Moon question', { mission: 'moon', material: 'nomex' });
  library.record('Acrylic at 16.8% oxygen', { airflow: 21, thickness: 1, q: 'Acrylic at 16.8% oxygen' });
  const entries = createQuestionLibrary(store).list();
  assert.equal(entries.length, 2); assert.equal(entries[0].question, 'Acrylic at 16.8% oxygen');
  assert.deepEqual(entries[0].params, { airflow: 21, thickness: 1, q: 'Acrylic at 16.8% oxygen' });
  assert.deepEqual(Object.keys(entries[0]).sort(), ['id', 'params', 'question', 'savedAt']);
  assert.equal(library.list('MOON').length, 1);
  entries[0].params.thickness = 5;
  assert.equal(library.list()[0].params.thickness, 1, 'callers cannot change the saved request');
});

test('FR-22: only the latest 50 questions are kept and removal can be undone', () => {
  const store = storage(), library = make(store);
  for (let i = 0; i < LIBRARY_LIMIT + 10; i++) library.record(`Question ${i}`, { q: `Question ${i}` });
  assert.equal(library.list().length, LIBRARY_LIMIT); assert.equal(library.list().at(-1).question, 'Question 10');
  const removed = library.list()[1];
  assert.equal(library.remove(removed.id), true); assert.equal(library.canUndo, true);
  assert.equal(createQuestionLibrary(store).list().length, 49);
  assert.equal(library.undo(), true); assert.equal(library.list()[1].id, removed.id);
  assert.equal(library.canUndo, false); assert.equal(library.remove('missing'), false);
  const oldest = library.list().at(-1);
  library.remove(oldest.id);
  library.record('Newest question', { q: 'Newest question' });
  library.undo();
  assert.equal(library.list().length, LIBRARY_LIMIT);
  assert.equal(library.list().at(-1).id, oldest.id, 'undo restores an old question even after the library fills');
});

test('FR-22: malformed storage and forged answers never become scientific results', () => {
  const store = storage(); store.setItem(LIBRARY_KEY, '{broken');
  const library = make(store); assert.deepEqual(library.list(), []);
  store.setItem(LIBRARY_KEY, JSON.stringify([
    { id: 'a', question: '<img src=x onerror=alert(1)>', params: { q: 'Nomex on the ISS' }, savedAt: 1, verdict: 'Safe', headline: 'Invented claim' },
    { id: 'b', question: 'Fake', params: { verdict: 'Safe' }, savedAt: 2 },
    { id: 'c', question: 'Fake', params: [], savedAt: 3 },
    { id: 'd', question: 'Fake', params: { q: 'Fake' }, savedAt: 'not a date' }
  ]));
  library.reload(); assert.equal(library.list().length, 1);
  assert.equal(library.list()[0].question, '<img src=x onerror=alert(1)>', 'question text is data, escaped by the UI');
  assert.equal(library.list()[0].verdict, undefined); assert.equal(library.list()[0].headline, undefined);
  assert.equal(library.record('Bad params', { q: ['question'] }), false);
});

test('FR-22: blocked or full storage leaves a usable in-memory library', () => {
  const denied = { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); } };
  const library = make(denied); assert.equal(library.durable, false);
  library.record('Still air', { q: 'Will acrylic burn in still air?' });
  assert.equal(library.list().length, 1); assert.equal(library.durable, false);
  library.remove(library.list()[0].id); library.undo(); assert.equal(library.list().length, 1);
});

test('FR-22: restored tap requests preserve joint conditions and get a fresh answer', async () => {
  const params = { mission: 'iss', material: 'pmma', air: 'earth', thickness: 1, o2: 16.8, airflow: 21 };
  const library = make(); library.record('Saved combination', params);
  const sent = [], answers = [];
  const controller = createController({ request: async p => { sent.push(p); return ask(p); }, onAnswer: (d, meta) => answers.push({ d, meta }), onError: e => { throw e; } });
  await controller.restore(library.list()[0].params, 'Saved combination');
  assert.deepEqual(sent[0], params); assert.equal(answers[0].d.verdict.state, 'no-data');
  assert.equal(askedFor(answers[0].d, answers[0].meta), answers[0].d.canonical, 'the server labels the answer it actually computed');
  assert.deepEqual(answers[0].meta.params, params);
});

test('FR-21/22: a newer question beats a pending library reopen, and unresolved saved questions stay unresolved', async () => {
  const pending = [], answers = [];
  const controller = createController({ request: p => new Promise(resolve => pending.push({ p, resolve })), onAnswer: d => answers.push(d), onError: e => { throw e; } });
  const old = controller.restore({ q: 'Will acrylic burn on the ISS?' });
  const current = controller.ask('Will Nomex burn on the ISS?');
  pending[1].resolve(ask(pending[1].p)); await current;
  pending[0].resolve(ask(pending[0].p)); await old;
  assert.equal(answers.length, 1); assert.equal(answers[0].verdict.state, 'no-burn');
  const unclear = controller.restore({ q: 'Will a -1 mm acrylic sheet burn on the ISS?' });
  pending[2].resolve(ask(pending[2].p)); await unclear;
  assert.equal(answers.at(-1).verdict.state, 'unresolved');
  const tap = controller.change({ mission: 'moon' });
  assert.equal(pending[3].p.q, 'Will a -1 mm acrylic sheet burn on the ISS?');
  pending[3].resolve(ask(pending[3].p)); await tap;
  assert.equal(answers.at(-1).verdict.state, 'unresolved');
});

test('FR-21/22: a tap during library loading waits and applies to the restored scenario', async () => {
  const pending = [], answers = [];
  const controller = createController({ request: p => new Promise(resolve => pending.push({ p, resolve })), onAnswer: d => answers.push(d), onError: e => { throw e; } });
  const restore = controller.restore({ q: 'Will acrylic burn on the Moon?' });
  await controller.change({ material: 'nomex' }); assert.equal(pending.length, 1);
  pending[0].resolve(ask(pending[0].p)); await new Promise(r => setImmediate(r));
  assert.equal(answers.length, 0); assert.equal(pending[1].p.mission, 'moon'); assert.equal(pending[1].p.material, 'nomex');
  pending[1].resolve(ask(pending[1].p)); await restore;
  assert.equal(answers[0].scenario.mission.id, 'moon');
});
