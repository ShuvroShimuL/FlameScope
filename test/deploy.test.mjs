import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { CSP, createServer, publicHosts } from '../src/api/server.mjs';
import vercelHandler from '../api/index.mjs';

// Hosted copies (ADR-014): Vercel serves web/ itself, so its headers must match what the local server sends.
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const headersFor = source => Object.fromEntries(vercel.headers.find(h => h.source === source).headers.map(h => [h.key, h.value]));

test('vercel.json serves web/ with the same CSP as the server, and sends everything else to the handler', () => {
  assert.equal(vercel.outputDirectory, 'web');
  assert.deepEqual(headersFor('/(.*)'), { 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' });
  assert.deepEqual(vercel.rewrites, [{ source: '/(.*)', destination: '/api/index' }]);
  assert.equal(vercel.functions['api/index.mjs'].includeFiles, 'data/**', 'compute reads data/ at runtime');
  assert.ok(existsSync(new URL('../web/index.html', import.meta.url)) && existsSync(new URL('../web/research/index.html', import.meta.url)));
});

test('public host names come from PUBLIC_HOSTS and the names Vercel sets, and nothing else', () => {
  assert.deepEqual(publicHosts({}), []);
  assert.deepEqual(publicHosts({ PUBLIC_HOSTS: ' FlameScope.example , ,b.example', VERCEL_URL: 'x-123.vercel.app', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' }),
    ['flamescope.example', 'b.example', 'x-123.vercel.app', 'x.vercel.app']);
});

const call = (port, path, { method = 'GET', headers = {}, body } = {}) => new Promise((resolve, reject) => {
  const req = http.request({ host: '127.0.0.1', port, path, method, headers }, res => {
    let data = ''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, body: data }));
  });
  req.on('error', reject); req.end(body);
});
const withServer = async (server, fn) => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try { return await fn(server.address().port); } finally { await new Promise(r => server.close(r)); }
};

test('a published name is accepted as Host and as an https Origin; other names are still refused', () => withServer(createServer({ hosts: ['flamescope.example'] }), async port => {
  assert.equal((await call(port, '/api/data', { headers: { Host: 'flamescope.example' } })).status, 200);
  assert.equal((await call(port, '/api/data', { headers: { Host: 'evil.example' } })).status, 403);
  const brief = origin => call(port, '/api/brief', { method: 'POST', headers: { Host: 'flamescope.example', Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Does thicker acrylic spread slower?', ids: ['M1', 'M2'] }) });
  assert.equal((await brief('https://flamescope.example')).status, 200);
  assert.equal((await brief('http://flamescope.example')).status, 403, 'a hosted page is only ever https');
  assert.equal((await brief('https://evil.example')).status, 403);
}));

test('the Vercel entry point is the same handler: it answers questions and serves pages', () => withServer(http.createServer(vercelHandler), async port => {
  const host = { Host: `127.0.0.1:${port}` };
  const answer = await call(port, '/api/ask?q=' + encodeURIComponent('Will acrylic burn on the ISS?'), { headers: host });
  assert.equal(answer.status, 200); assert.ok(JSON.parse(answer.body).scenario);
  assert.equal((await call(port, '/theme.js', { headers: host })).status, 200);
}));
