---
name: compute-boundary
description: Guard FlameScope's src/compute boundary — deterministic science with no LLM, network, env or randomness. Use before editing anything in src/compute/, when adding a verdict/finding/number, or when tempted to compute science in api/, agents/ or web/.
---

# The compute boundary

`src/compute/` is the judges' Validity argument: *every scientific statement is a tested pure function of committed data.*

## Allowed in `src/compute/`

- Reading `data/` with `readFileSync` at load time
- Pure functions of `(records, request)`, with derived constants such as `ENVELOPE` computed from records
- `createdAt` timestamps as metadata (the only wall-clock use)

## Forbidden in `src/compute/` (enforced by `test/boundary.test.mjs`)

`fetch(`, `node:http(s)`, `openai`, `anthropic`, `process.env`, `Math.random`, imports from `../agents/` or `../acquire/`.

## Where logic goes

| You want to… | Put it in |
|---|---|
| Compute a verdict, finding, range, comparison or gap | `src/compute/` |
| Fetch or refresh remote data | `src/acquire/` via `safe.mjs` |
| Let a model rank, select or route | `src/agents/`. Its output must be IDs or params that compute consumes. |
| Validate HTTP input and map it to compute | `src/api/` |
| Format for display | `web/`, but never compute a claim there |

## Checklist for a compute change

1. Is every new number derived from `data/` or from a cited constant in `SOURCES`? If it's a constant, add its source.
2. Missing input → `null` plus a notice. Never a default number presented as fact.
3. Does the wording avoid "safe", causal claims and extrapolation? Findings say "descriptive."
4. Add a test that pins the exact output for a real row.
5. Run `node --test` and `node scripts/evaluate.mjs`.
