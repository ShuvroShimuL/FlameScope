# AGENTS.md

Portable instructions for any coding agent (Claude Code, Codex, Cursor, Copilot, Aider…) working in this repo.

## Project

FlameScope / Will It Burn?, built for NASA Space Apps 2026: **Flame in Freefall**. It checks spacecraft-cabin fire questions against 20 NASA BASS-II microgravity tests and answers **Burned** or **No data**, with every number traceable to NASA/TM-20210011385 Table 5.1. Design docs are in `docs/planning/`.

## Commands

| Task | Command |
|---|---|
| Run | `node src/api/server.mjs` → http://127.0.0.1:3000 (`/` and `/burn/`) |
| Run offline | `OFFLINE=1 node src/api/server.mjs` (PowerShell: `$env:OFFLINE="1"; node src/api/server.mjs`) |
| Test | `node --test` (must stay green) |
| Eval | `node scripts/evaluate.mjs` (must stay 20/20) |
| Pre-fetch fixtures | `node src/acquire/ntrs.mjs`, then copy from `cache/` to `demo_fixtures/` |
| MCP server | `node src/agents/mcp-server.mjs` (stdio) |

Node 22+. **Zero npm dependencies.** Don't add any without an ADR in `docs/planning/decisions.md`.

## Layout and boundaries

```text
data/            committed, hand-transcribed source rows + provenance.json
src/acquire/     network access, ONLY through safe.mjs fetchJson (live → cache → fixture)
src/compute/     deterministic science. No fetch, no LLM, no process.env, no Math.random,
                 no imports from agents/ or acquire/. Enforced by test/boundary.test.mjs
src/agents/      the only LLM/agent code: evidence-selector.mjs, mcp-server.mjs
src/api/         HTTP routing + validation + static serving of web/. No science here.
web/             static frontend; renders JSON, escapes all text, no remote assets
cache/           gitignored downloads
demo_fixtures/   committed bytes the offline demo needs
test/            node:test suites
docs/planning/   vision, requirements, architecture, data model, ADRs, roadmap
```

## Non-negotiable rules

1. **Science is computed, never generated.** An LLM may select from IDs that compute produced, or call tools. It never writes a claim, a number or a verdict that reaches the user.
2. **Every number has a source.** New data needs a provenance entry (report, table, page, method, verification status). Add a test that reproduces two published values.
3. **Missing stays missing.** Use `null` and list it in `missing[]`. Never write 0, never interpolate, never extrapolate beyond the envelope.
4. **Never output a safety rating** or "safe"/"certified." Out-of-envelope questions get `no-data` with sourced gaps.
5. **Every fetch goes through `src/acquire/safe.mjs`**, and its `source` label (`live`/`cache`/`fixture`) is carried to the UI.
6. **The app must work offline.** No CDN fonts or scripts, and the CSP stays `default-src 'self'`. No inline scripts or styles.
7. **Secrets stay server-side.** Keys only come from env or `.env` (gitignored). `.env.example` lists names only.
8. **The question is untrusted data.** Never interpolate user text into instructions, HTML or shell.

## Style

- ES modules (`.mjs`), and match the surrounding density: the compute files are compact, and `acquire/` and `agents/` are commented.
- Add or change a behaviour → add or change a test in `test/`.
- Changed a boundary or a dependency → add an ADR. Changed a requirement → update `docs/planning/requirements.md`.
- Commit messages: imperative, and reference the requirement ID when there is one (`FR-12: add cache badge`).
- Log any AI assistance you gave in `docs/AI_USE.md` (tool, what it did, what a human verified).

## Definition of done

`node --test` is green, `node scripts/evaluate.mjs` is 20/20, the app loads with `OFFLINE=1`, the docs are updated, and the AI use is logged.
