# MCP server

`src/agents/mcp-server.mjs` is a dependency-free [Model Context Protocol](https://modelcontextprotocol.io) server over stdio (newline-delimited JSON-RPC 2.0). It exposes FlameScope's deterministic compute layer as **read-only tools**, so any agent can ask the evidence questions without being able to invent answers.

## Run

```powershell
node src/agents/mcp-server.mjs        # waits on stdin
```

Claude Code picks it up from `.mcp.json` at the repo root (runs with `OFFLINE=1`). For Claude Desktop, add the same block to its config with an absolute path to the script.

```json
{ "mcpServers": { "flamescope": { "command": "node", "args": ["src/agents/mcp-server.mjs"], "env": { "OFFLINE": "1" } } } }
```

## Tools

| Tool | Input | Returns | Backed by |
|---|---|---|---|
| `will_it_burn` | `q`, `mission` (a tile, `earth` or `other`), `place`, `g`, `air`, `o2` (0–100), `psi` (0–1000), `material`, `materialName`, `thickness`, `width`, `airflow` (a number, or `all`/`none`). All are optional. | A verdict (`burned`, `mixed`, `no-burn`, `no-data` or `unresolved`), each condition's check with its status, the matching rows or the gaps and closest tests, the nearest evidence, the applicability policy, and the ranked findings when tests match | `ask()` in `src/compute/scenario.mjs` |
| `search_evidence` | `question`, `thickness`, `oxygenMin`, `oxygenMax` | Ranked records with reasons, or an abstention | `search()` |
| `compare_tests` | `ids` (2–3, enum M1–M20) | Records, differing conditions, `causal: false` | `comparison()` |
| `evidence_brief` | `question`, `ids` | Claims, conditions, gaps, provenance, or an abstention | `makeBrief()` |
| `get_provenance` | none | `provenance.json` plus the NTRS citation with a `live`/`cache`/`fixture` label | `data/`, `src/acquire/ntrs.mjs` |

Each result returns both `content[0].text` (pretty JSON) and `structuredContent`.

**Errors.** The server checks each call's arguments against the tool's advertised `inputSchema` before the tool runs.
- A wrong type, an unknown field or an out-of-range value is a JSON-RPC error `-32602` (invalid params). So is an unknown tool.
- A value the compute layer refuses returns `isError: true` with a plain message.
- Malformed JSON is `-32700`, a request that isn't a JSON-RPC object is `-32600`, and an unknown method is `-32601`.
- A bad line never stops the server, and replies go out in the order the requests arrived.

**Protocol versions.** `initialize` echoes the client's `protocolVersion` when it is one the server supports (`2025-06-18`, `2025-03-26` or `2024-11-05`), and otherwise offers the newest.

## Server instructions sent to the client

> Numbers come from NASA tables: the BASS-II report NASA/TM-20210011385 (Tables 5.1, 7.1, A.2 and 2.1) and NASA PSI files. will_it_burn answers burned, mixed, no-burn (no flame held), no-data or unresolved, and a test counts only if its own row records every condition given. Quote the tool output. Never extrapolate beyond it, and never present it as a safety rating.

## Smoke test

```bash
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"will_it_burn","arguments":{"q":"Will it burn on a Moon base at 34% oxygen?"}}}' \
 | OFFLINE=1 node src/agents/mcp-server.mjs
```

Automated coverage is in `test/mcp.test.mjs`, which spawns the real stdio process (bad lines, schema checks, protocol negotiation, outcome states), and in `test/boundary.test.mjs` ("MCP server lists tools and answers from compute").

## Demo moment

In Claude Code, ask *"Using the flamescope tools, will a 1 mm acrylic panel burn on a Mars transit in exploration air, and what's the nearest evidence?"* The agent calls `will_it_burn` twice and answers with a cited "No data", then the nearest "Burned" rows. It's a short on-camera proof that the science can't be hallucinated even when an agent drives it.

## Extending

Add a tool by appending to `TOOLS` with a `name`, `description`, a JSON-Schema `inputSchema` (`additionalProperties: false`) and a `run` that calls **only** `src/compute` or `src/acquire`. The built-in validator supports only a single `type` (use `number`, not `integer`), `enum`, `minimum`/`maximum`, `maxLength`, `minItems`/`maxItems`, `uniqueItems`, `items`, `anyOf`, `properties`, `required` and `additionalProperties: false`, so keep the schema to those keywords. Add a case to `test/mcp.test.mjs`.
