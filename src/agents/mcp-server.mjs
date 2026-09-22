// FlameScope MCP server (stdio, newline-delimited JSON-RPC 2.0, no dependencies).
// Exposes the deterministic src/compute functions as tools, so any MCP client — Claude Code,
// Claude Desktop, an orchestrator — can query the evidence without being able to invent it.
// Every tool result is computed, never generated. Register with .mcp.json at the repo root.
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { records, provenance, search, comparison, makeBrief } from '../compute/evidence.mjs';
import { ask, InputError } from '../compute/scenario.mjs';
import { reportCitation } from '../acquire/ntrs.mjs';

const ids = records.map(r => r.id);
const asStrings = args => Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)]));

export const TOOLS = [
  { name: 'will_it_burn',
    description: 'Check a spacecraft cabin scenario against the envelope of NASA BASS-II tests. Returns a verdict ("burned" or "no-data"), each condition check, evidence rows or gap cards with sources. Never returns a safety rating.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      q: { type: 'string', maxLength: 500, description: 'Plain-English question, e.g. "Will it burn on a Moon base at 34% oxygen?"' },
      mission: { type: 'string', enum: ['iss', 'moon', 'transit', 'mars'] },
      air: { type: 'string', enum: ['earth', 'exploration'] },
      o2: { type: 'number', minimum: 1, maximum: 100, description: 'Oxygen share, vol %' },
      psi: { type: 'number', minimum: 1, maximum: 30, description: 'Cabin pressure, psi' },
      thickness: { type: 'string', description: '"all" or a thickness in mm' },
      airflow: { type: 'string', description: '"none" or airflow in cm/s' } } },
    run: args => ask(asStrings(args)) },
  { name: 'search_evidence',
    description: 'Search the 20 BASS-II PMMA sheet tests by question text, test ID, thickness or initial-oxygen range. Abstains on unsupported questions (safety ratings, other materials, other environments).',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      question: { type: 'string', maxLength: 2000 }, thickness: { type: 'number' },
      oxygenMin: { type: 'number' }, oxygenMax: { type: 'number' } } },
    run: args => search(asStrings(args)) },
  { name: 'compare_tests',
    description: 'Descriptive comparison of 2–3 tests: which conditions differ and why the comparison is not causal.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['ids'], properties: {
      ids: { type: 'array', items: { type: 'string', enum: ids }, minItems: 2, maxItems: 3, uniqueItems: true } } },
    run: ({ ids: want = [] }) => { const items = records.filter(r => want.includes(r.id));
      if (items.length < 2 || items.length > 3) throw new InputError('Select two or three distinct tests.');
      return { records: items, ...comparison(items) }; } },
  { name: 'evidence_brief',
    description: 'Build a source-linked evidence brief (published measurements, conditions, gaps) or an abstention for a question over chosen tests.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['question', 'ids'], properties: {
      question: { type: 'string', maxLength: 2000 },
      ids: { type: 'array', items: { type: 'string', enum: ids }, minItems: 1, maxItems: 20 } } },
    run: ({ question = '', ids: want = [] }) => makeBrief(String(question), records.filter(r => want.includes(r.id))) },
  { name: 'get_provenance',
    description: 'Where the data came from: report, table, page, transcription method, verification status, limitations, and the live/cache/fixture status of the NTRS citation.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
    run: async () => ({ ...provenance, citation: await reportCitation().catch(e => ({ error: e.message })) }) }
];

export async function handle({ id, method, params = {} }) {
  if (method === 'initialize') return { protocolVersion: params.protocolVersion || '2025-06-18',
    capabilities: { tools: {} }, serverInfo: { name: 'flamescope', version: '1.0.0' },
    instructions: 'Every number comes from NASA/TM-20210011385 Table 5.1. Quote tool output; never extrapolate beyond it or present it as a safety rating.' };
  if (method === 'tools/list') return { tools: TOOLS.map(({ run, ...t }) => t) };
  if (method === 'tools/call') {
    const tool = TOOLS.find(t => t.name === params.name);
    if (!tool) throw Object.assign(Error(`Unknown tool: ${params.name}`), { code: -32602 });
    try { const out = await tool.run(params.arguments || {});
      return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out }; }
    catch (e) { return { content: [{ type: 'text', text: e instanceof InputError ? e.message : 'Tool failed.' }], isError: true }; }
  }
  if (method === 'ping') return {};
  if (id === undefined) return undefined; // notifications, e.g. notifications/initialized
  throw Object.assign(Error(`Method not found: ${method}`), { code: -32601 });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = msg => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');
  createInterface({ input: process.stdin }).on('line', async line => {
    if (!line.trim()) return;
    let msg; try { msg = JSON.parse(line); } catch { return write({ id: null, error: { code: -32700, message: 'Parse error' } }); }
    try { const result = await handle(msg); if (msg.id !== undefined && result !== undefined) write({ id: msg.id, result }); }
    catch (e) { if (msg.id !== undefined) write({ id: msg.id, error: { code: e.code || -32603, message: e.message } }); }
  });
}
