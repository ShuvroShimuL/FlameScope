import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { handle, TOOLS } from '../../scripts/mcp-server.mjs';

// The evidence engine's boundary. Its answers are computed from committed rows by fixed rules, so the
// modules that compute them must have no way to reach a model, the network, the environment or chance.
const dir = new URL('../../lib/evidence/', import.meta.url);
const modules = [...readdirSync(dir).filter(f => f.endsWith('.mjs')),
  ...readdirSync(new URL('client/', dir)).filter(f => f.endsWith('.mjs')).map(f => `client/${f}`)];
const read = file => readFileSync(new URL(file, dir), 'utf8');

test('lib/evidence stays deterministic: no network, model, env or random-number use', () => {
  assert.ok(modules.includes('scenario.mjs') && modules.includes('client/state.mjs'));
  for (const file of modules)
    assert.doesNotMatch(read(file), /\bfetch\(|node:https?|openai|anthropic|@google\/genai|process\.env|Math\.random/i, file);
});

test('lib/evidence never imports VESTA, a provider, or anything outside itself', () => {
  for (const file of modules) {
    const imports = [...read(file).matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)].map(m => m[1]);
    for (const spec of imports) {
      if (spec.startsWith('node:')) continue;
      assert.match(spec, /^\.\.?\//, `${file} imports ${spec}`);
      assert.doesNotMatch(spec, /vesta|providers|\.\.\/\.\.\//, `${file} imports ${spec}`);
    }
  }
});

test('only files.mjs touches the disk, and it only reads data/evidence', () => {
  for (const file of modules.filter(f => f !== 'files.mjs'))
    assert.doesNotMatch(read(file), /node:fs|readFileSync|writeFileSync|import\.meta\.url/, file);
  const files = read('files.mjs');
  assert.match(files, /path\.join\(process\.cwd\(\), 'data', 'evidence'\)/);
  assert.doesNotMatch(files, /writeFileSync|mkdirSync|appendFileSync|rmSync|unlinkSync/);
});

test('the browser-side modules use no Node API, so the page runs the code the tests run', () => {
  for (const file of modules.filter(f => f.startsWith('client/')))
    assert.doesNotMatch(read(file), /from 'node:|require\(|process\./, file);
});

test('the committed NTRS citation fixture is the BASS-II report', () => {
  const fixture = JSON.parse(readFileSync(new URL('../../data/evidence/fixtures/ntrs-20210011385.json', import.meta.url), 'utf8'));
  assert.match(fixture.title, /BASS-II/);
});

test('MCP server lists tools and answers from the engine', async () => {
  const init = await handle({ id: 1, method: 'initialize', params: {} });
  assert.equal(init.serverInfo.name, 'flamescope');
  const { tools } = await handle({ id: 2, method: 'tools/list' });
  assert.deepEqual(tools.map(t => t.name), TOOLS.map(t => t.name));
  assert.ok(tools.every(t => t.inputSchema && !('run' in t)));
  const iss = await handle({ id: 3, method: 'tools/call', params: { name: 'will_it_burn', arguments: { q: 'Will acrylic burn on the ISS?' } } });
  assert.equal(iss.structuredContent.verdict.state, 'burned');
  const moon = await handle({ id: 4, method: 'tools/call', params: { name: 'will_it_burn', arguments: { mission: 'moon' } } });
  assert.equal(moon.structuredContent.verdict.state, 'no-data');
  // One test ID breaks the schema's minItems, so it is a protocol error (-32602), not a tool result.
  await assert.rejects(handle({ id: 5, method: 'tools/call', params: { name: 'compare_tests', arguments: { ids: ['M7'] } } }), e => e.code === -32602);
  await assert.rejects(handle({ id: 6, method: 'tools/call', params: { name: 'nope' } }));
  assert.equal(await handle({ method: 'notifications/initialized' }), undefined);
});

test('the MCP server makes no network or model call: its citation is the committed fixture, labelled as one', async () => {
  const src = readFileSync(new URL('../../scripts/mcp-server.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\(|node:https?|openai|anthropic|process\.env/i);
  const r = await handle({ id: 7, method: 'tools/call', params: { name: 'get_provenance', arguments: {} } });
  assert.equal(r.structuredContent.citation.source, 'fixture');
  assert.match(r.structuredContent.citation.title, /BASS-II/);
});

test('the engine finds its data when started from another folder, as an MCP client or a script may do', async () => {
  const { spawnSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  const { fileURLToPath, pathToFileURL } = await import('node:url');
  const entry = pathToFileURL(fileURLToPath(new URL('../../lib/evidence/scenario.mjs', import.meta.url))).href;
  const run = spawnSync(process.execPath, ['-e', `import(${JSON.stringify(entry)}).then(m => console.log(m.ask({ q: 'Will acrylic burn on the ISS?' }).verdict.state))`], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout.trim(), 'burned');
});
