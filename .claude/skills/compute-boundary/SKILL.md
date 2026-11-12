---
name: compute-boundary
description: Guard FlameScope's evidence-engine boundary in lib/evidence — deterministic science with no LLM, network, env or randomness. Use before editing anything in lib/evidence/, when adding a verdict/finding/number about solid materials, or when tempted to compute science in app/, components/ or lib/vesta/.
---

# The evidence-engine boundary

`lib/evidence/` is the Validity argument for solid materials: *every scientific statement is a tested pure function of committed data.* It answers "Will it burn?" from NASA's BASS-II rows and has no way to reach a model.

## Allowed in `lib/evidence/`

- Reading `data/evidence/` through `files.mjs` at load time. `files.mjs` is the only module that touches the disk.
- Pure functions of `(rows, request)`, with derived constants such as `ENVELOPE` computed from the rows
- `createdAt` timestamps as metadata (the only wall-clock use)
- In `client/`: browser-side logic with no Node API (request ordering, saved questions, the Markdown brief)

## Forbidden in `lib/evidence/` (enforced by `tests/evidence/boundary.test.mjs`)

`fetch(`, `node:http(s)`, `openai`, `anthropic`, `@google/genai`, `process.env`, `Math.random`, any import from outside the folder (including `lib/vesta`), and `node:fs` anywhere but `files.mjs`.

## Where logic goes

| You want to… | Put it in |
|---|---|
| Compute a verdict, finding, range, comparison or gap about a solid material | `lib/evidence/` |
| Give the server typed access to it | `lib/burn.ts` |
| Give the browser typed access to its client modules | `lib/evidence/client/index.ts` |
| Let VESTA use it | `lib/vesta/tools/will_it_burn.ts`. It passes the answer on and adds no number. |
| Validate HTTP input and map it to the engine | `app/api/burn/` |
| Format for display | `components/burn/`, but never compute a claim there |
| Anything about gas or droplet flames (ACME, CFI, SPICE) | `lib/physics.ts`, `lib/analysis.ts`, `lib/safety.ts`. Never mix the two sets (ADR-017). |

## Checklist for an engine change

1. Is every new number derived from `data/evidence/` or from a cited constant in `SOURCES`? If it's a constant, add its source.
2. Missing input → `null` plus a notice. Never a default number presented as fact, and never a value taken from the dashboard's active mission.
3. Does the wording avoid "safe", causal claims and extrapolation? Findings say "descriptive."
4. Add a test in `tests/evidence/` that pins the exact output for a real row.
5. If the answer's shape changed, update `lib/evidence/types.ts`, the tool's `dataFor` and the brief.
6. Run `npm test` and `npm run evaluate` (must stay 20/20).
