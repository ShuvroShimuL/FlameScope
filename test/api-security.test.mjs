import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../src/api/server.mjs';
import { transport, callProvider, ProviderError } from '../src/agents/provider.mjs';
import { selectEvidence } from '../src/agents/evidence-selector.mjs';
import { records } from '../src/compute/evidence.mjs';

// No test here reaches a real provider: transport.fetch is replaced, and the only key used is a fake one.
async function withServer(fn) {
  const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  try { return await fn(server.address().port); } finally { await new Promise(r => server.close(r)); }
}
function raw(port, path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers }, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }));
    });
    req.on('error', reject); if (body !== undefined) req.write(body); req.end();
  });
}
function withEnv(vars, fn) {
  const saved = Object.fromEntries(Object.keys(vars).map(k => [k, process.env[k]]));
  for (const [k, v] of Object.entries(vars)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  const restore = () => { for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v; };
  return Promise.resolve().then(fn).finally(restore);
}
function mockTransport(impl) {
  const calls = [], saved = transport.fetch;
  transport.fetch = async (url, options) => { calls.push({ url, options }); return impl(url, options); };
  return { calls, restore: () => { transport.fetch = saved; } };
}
const brief = (port, payload, headers = {}) => raw(port, '/api/brief', { method: 'POST', headers: { 'Content-Type': 'application/json', Host: `127.0.0.1:${port}`, ...headers },
  body: typeof payload === 'string' ? payload : JSON.stringify(payload) });

test('only this server’s loopback names are accepted as Host, and cross-origin posts are refused', () => withServer(async port => {
  assert.equal((await raw(port, '/api/data', { headers: { Host: 'evil.example' } })).status, 403, 'a DNS-rebound name is refused');
  assert.equal((await raw(port, '/api/data', { headers: { Host: `evil.example:${port}` } })).status, 403);
  assert.equal((await raw(port, '/api/data', { headers: { Host: `localhost:${port}` } })).status, 200);
  assert.equal((await raw(port, '/api/data', { headers: { Host: `127.0.0.1:${port}` } })).status, 200);
  const ok = { question: 'M2 flame spread', ids: ['M2'] };
  assert.equal((await brief(port, ok, { Origin: 'http://evil.example' })).status, 403, 'a matching Host header no longer vouches for a foreign Origin');
  assert.equal((await brief(port, ok, { Host: 'evil.example', Origin: 'http://evil.example' })).status, 403, 'the old bypass: forged Host and Origin together');
  assert.equal((await brief(port, ok, { Origin: `http://localhost:${port}` })).status, 200);
}));

test('the brief endpoint refuses bodies that aren’t a well-typed object', () => withServer(async port => {
  for (const body of ['null', '[]', '5', '"text"', 'true']) assert.equal((await brief(port, body)).status, 400, body);
  assert.equal((await brief(port, '{bad json')).status, 400);
  const bad = await brief(port, { question: 'M2 flame spread', ids: ['M2'], ai: 'false' });
  assert.equal(bad.status, 400); assert.match(bad.body.error, /ai must be true or false/);
  assert.equal((await brief(port, { question: 'M2 flame spread', ids: ['M2'], extra: 1 })).status, 400);
  assert.equal((await brief(port, { question: 'M2 flame spread', ids: ['M2'], ai: false })).status, 200);
}));

test('offline, the AI option never reaches the provider', () => withEnv({ OFFLINE: '1', OPENAI_API_KEY: 'test-key' }, () => withServer(async port => {
  const mock = mockTransport(() => { throw new Error('must not be called'); });
  try {
    const r = await brief(port, { question: 'M2 flame spread', ids: ['M2'], ai: true });
    assert.equal(r.status, 200); assert.match(r.body.notice, /Offline mode/); assert.equal(r.body.mode, 'Offline evidence brief');
    assert.equal(mock.calls.length, 0);
    await assert.rejects(callProvider('https://example.invalid', {}), ProviderError, 'the provider refuses offline even without the route’s gate');
    assert.equal(mock.calls.length, 0);
  } finally { mock.restore(); }
})));

test('a provider failure falls back to the deterministic brief, and a valid selection is re-checked', () => withEnv({ OFFLINE: undefined, OPENAI_API_KEY: 'test-key' }, () => withServer(async port => {
  let mock = mockTransport(() => ({ ok: false, status: 503, json: async () => ({}) }));
  try {
    const r = await brief(port, { question: 'M2 and M8 flame spread', ids: ['M2', 'M8'], ai: true });
    assert.equal(r.status, 200); assert.match(r.body.notice, /AI selection unavailable/); assert.equal(r.body.mode, 'Offline evidence brief');
    assert.equal(mock.calls.length, 1);
    assert.equal(mock.calls[0].options.headers.Authorization, 'Bearer test-key');
    assert.doesNotMatch(mock.calls[0].options.body, /test-key/, 'the key never goes in the body');
  } finally { mock.restore(); }
  mock = mockTransport(() => ({ ok: true, status: 200, json: async () => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ ids: ['M8'], abstain: false }) }] }] }) }));
  try {
    const r = await brief(port, { question: 'M2 and M8 flame spread', ids: ['M2', 'M8'], ai: true });
    assert.equal(r.body.mode, 'AI-selected evidence · verified wording'); assert.deepEqual(r.body.claims.map(c => c.id), ['M8']);
  } finally { mock.restore(); }
})));

test('the provider boundary: no key, timeouts, bad replies and invented IDs all fail closed', () => withEnv({ OFFLINE: undefined, OPENAI_API_KEY: 'test-key' }, async () => {
  const items = records.slice(0, 3);
  const reply = text => mockTransport(() => ({ ok: true, status: 200, json: async () => ({ output: [{ content: [{ type: 'output_text', text }] }] }) }));
  for (const [text, why] of [['not json', 'non-JSON output'], [JSON.stringify({ ids: ['M20'], abstain: false }), 'an ID outside the offered rows'],
    [JSON.stringify({ ids: 'M1', abstain: false }), 'ids that aren’t a list'], [JSON.stringify(null), 'a null selection']]) {
    const mock = reply(text);
    try { await assert.rejects(selectEvidence('M1 flame spread', items), Error, why); } finally { mock.restore(); }
  }
  let mock = mockTransport(() => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad'); } }));
  try { await assert.rejects(callProvider('https://example.invalid', {}), /isn’t JSON/); } finally { mock.restore(); }
  mock = mockTransport((url, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason))));
  try { await assert.rejects(callProvider('https://example.invalid', {}, { timeoutMs: 20 }), /timed out/); } finally { mock.restore(); }
  mock = mockTransport(() => { throw new Error('must not be called'); });
  try {
    await withEnv({ OPENAI_API_KEY: undefined }, () => assert.rejects(callProvider('https://example.invalid', {}), /No provider key/));
    assert.equal(mock.calls.length, 0);
  } finally { mock.restore(); }
}));
