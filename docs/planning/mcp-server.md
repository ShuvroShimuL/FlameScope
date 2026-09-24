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
| `will_it_burn` | `q`, `mission`, `air`, `o2`, `psi`, `thickness`, `airflow` (all optional) | Verdict, checks, evidence or gaps, nearest, and the ranked findings when the tests cover the cabin | `ask()` in `src/compute/scenario.mjs` |
| `search_evidence` | `question`, `thickness`, `oxygenMin`, `oxygenMax` | Ranked records with reasons, or an abstention | `search()` |
| `compare_tests` | `ids` (2–3, enum M1–M20) | Records, differing conditions, `causal: false` | `comparison()` |
| `evidence_brief` | `question`, `ids` | Claims, conditions, gaps, provenance, or an abstention | `makeBrief()` |
| `get_provenance` | none | `provenance.json` plus the NTRS citation with a `live`/`cache`/`fixture` label | `data/`, `src/acquire/ntrs.mjs` |

Each result returns both `content[0].text` (pretty JSON) and `structuredContent`. Bad input returns `isError: true` with a plain message, and the server never crashes.

## Server instructions sent to the client

> Every number comes from NASA/TM-20210011385 Table 5.1. Quote tool output; never extrapolate beyond it or present it as a safety rating.

## Smoke test

```bash
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"will_it_burn","arguments":{"q":"Will it burn on a Moon base at 34% oxygen?"}}}' \
 | OFFLINE=1 node src/agents/mcp-server.mjs
```

Automated coverage is in `test/boundary.test.mjs` ("MCP server lists tools and answers from compute").

## Demo moment

In Claude Code, ask *"Using the flamescope tools, will a 1 mm acrylic panel burn on a Mars transit in exploration air, and what's the nearest evidence?"* The agent calls `will_it_burn` twice and answers with a cited "No data", then the nearest "Burned" rows. It's a short on-camera proof that the science can't be hallucinated even when an agent drives it.

## Extending

Add a tool by appending to `TOOLS` with a `name`, `description`, a JSON-Schema `inputSchema` (`additionalProperties: false`) and a `run` that calls **only** `src/compute` or `src/acquire`. Add a case to `test/boundary.test.mjs`.
