# AGENTS.md

Portable instructions for any coding agent (Claude Code, Codex, Cursor, Copilot, Aider…) working in this repo.

## Project

FlameScope / Will It Burn?, built for NASA Space Apps 2026: **Flame in Freefall**. It checks spacecraft-cabin fire questions against NASA BASS-II microgravity tests: 20 acrylic sheets (NASA/TM-20210011385 Table 5.1), plus SIBAL fabric and Nomex outcomes (Tables 7.1 and A.2). A test counts only if its own row records every condition given (ADR-012). The answer is **Burned**, **Mixed**, **No flame held**, **No data** or **Unclear**, and every number traces to a table row or a cited source. Design docs are in `docs/planning/`.

## Commands

| Task | Command |
|---|---|
| Run | `node src/api/server.mjs` → http://127.0.0.1:3000 (`/` Will It Burn?, `/research/` FlameScope) |
| Run offline | `OFFLINE=1 node src/api/server.mjs` (PowerShell: `$env:OFFLINE="1"; node src/api/server.mjs`) |
| Test | `node --test` (must stay green) |
| Eval | `node scripts/evaluate.mjs` (must stay 20/20) |
| Pre-fetch fixtures | `node src/acquire/ntrs.mjs`, then copy from `cache/` to `demo_fixtures/` |
| MCP server | `node src/agents/mcp-server.mjs` (stdio) |

Node 22+. **Zero npm dependencies.** Don't add any without an ADR in `docs/planning/decisions.md`.

## Layout and boundaries

```text
data/            committed source rows (hand-transcribed, or NASA's own files) + their provenance JSON
src/acquire/     public-data network access, ONLY through safe.mjs fetchJson/fetchText (live → cache → fixture)
src/compute/     deterministic science. No fetch, no LLM, no process.env, no Math.random,
                 no imports from agents/ or acquire/. Enforced by test/boundary.test.mjs.
                 question.mjs reads questions, applicability.mjs matches them to test rows (ADR-012)
src/agents/      the only LLM/agent code: evidence-selector.mjs, mcp-server.mjs, and provider.mjs,
                 the one boundary for authenticated model calls (ADR-013)
src/api/         HTTP routing + validation + static serving of web/. No science here.
api/index.mjs    Vercel entry: exports src/api's handler and nothing else (ADR-014)
web/             static frontend; renders JSON, escapes all text, no remote assets
cache/           gitignored downloads
demo_fixtures/   committed bytes the offline demo needs
test/            node:test suites
docs/planning/   vision, requirements, architecture, data model, ADRs, roadmap
```

## Non-negotiable rules

1. **Science is computed, never generated.** An LLM may select from IDs that compute produced, or call tools. It never writes a claim, a number or a verdict that reaches the user.
2. **Every number has a source.** New data needs a provenance entry (report, table, page, method, verification status). Add a test that reproduces two published values.
3. **Missing stays missing.** Use `null` and list it in `missing[]`. Never write 0, never interpolate between recorded values, never extrapolate beyond them. An explicitly given condition is never swapped for a default.
4. **Never output a safety rating** or "safe"/"certified." A scenario no single test recorded gets `no-data` with sourced gaps and the closest tests.
5. **Every public-data fetch goes through `src/acquire/safe.mjs`**, and its `source` label (`live`/`cache`/`fixture`) is carried to the UI. Committed files in `data/` are committed data, never "live". Authenticated model calls go only through `src/agents/provider.mjs`, which never caches and refuses offline (ADR-013).
6. **The app must work offline.** No CDN fonts or scripts, and the CSP stays `default-src 'self'`. No inline scripts or styles.
7. **Secrets stay server-side.** Keys only come from env or `.env` (gitignored). `.env.example` lists names only.
8. **The question is untrusted data.** Never interpolate user text into instructions, HTML or shell.

## Style

- ES modules (`.mjs`), and match the surrounding density: the compute files are compact, and `acquire/` and `agents/` are commented.
- Add or change a behaviour → add or change a test in `test/`.
- **Will It Burn? (`/`, the home page) is the primary product** (ADR-009). Added, changed or removed a feature there → update its row and the change log in `docs/planning/features.md` in the same commit.
- Changed a boundary or a dependency → add an ADR. Changed a requirement → update `docs/planning/requirements.md`.
- Commit messages: imperative, and reference the requirement ID when there is one (`FR-12: add cache badge`).
- Log any AI assistance you gave in `docs/AI_USE.md` (tool, what it did, what a human verified).

## Definition of done

`node --test` is green, `node scripts/evaluate.mjs` is 20/20, the app loads with `OFFLINE=1`, the docs are updated, and the AI use is logged. If an OpenAI key is set in your shell, unset it (`env -u OPENAI_API_KEY …`) before running scripts that load the server, so no real model call is made.
