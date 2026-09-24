# Architecture

One Node.js process with zero dependencies. The rule that shapes everything else: **science is computed, never generated.**

```mermaid
flowchart LR
  subgraph acquire["src/acquire — public data, always via safe.mjs"]
    SAFE["safe.mjs<br/>live → cache → fixture"]
    NTRS["ntrs.mjs<br/>NASA NTRS citation"]
    PSI["psi.mjs<br/>NASA PSI tables"]
  end
  subgraph data["data/ — committed"]
    CSV["bass-table.csv, bass-fabric.csv,<br/>bass-nomex.csv, bass-extinction.csv"]
    PROV["provenance JSON"]
  end
  subgraph compute["src/compute — deterministic, no LLM"]
    EV["evidence.mjs<br/>parse · search · compare · brief"]
    Q["question.mjs<br/>reads the question"]
    APL["applicability.mjs<br/>each test's own row, all conditions together"]
    SC["scenario.mjs<br/>verdict · gaps · closest · nearest"]
  end
  subgraph agents["src/agents — the only LLM or agent surface"]
    SEL["evidence-selector.mjs<br/>LLM may pick IDs or abstain"]
    PRV["provider.mjs<br/>model calls only · refuses offline · no cache"]
    MCP["mcp-server.mjs<br/>compute exposed as MCP tools"]
  end
  API["src/api/server.mjs<br/>HTTP · static · JSON"]
  WEB["web/<br/>/ Will It Burn? · /research/ FlameScope"]

  NTRS --> SAFE
  PSI --> SAFE
  SAFE -.-> CACHE[(cache/)]
  SAFE -.-> FIX[(demo_fixtures/)]
  CSV --> EV --> APL --> SC
  Q --> SC
  PROV --> EV
  EV --> API
  SC --> API
  SEL --> API
  SEL --> PRV
  EV --> SEL
  EV --> MCP
  SC --> MCP
  NTRS --> MCP
  API --> WEB
```

## Layers and their contracts

| Layer | May | May not | Enforced by |
|---|---|---|---|
| `src/acquire/` | Fetch public data, but only through `fetchJson` or `fetchText` in `safe.mjs`, and write `cache/` | Compute science, call an LLM, or hold model credentials | `test/boundary.test.mjs`, code review, [CLAUDE.md](../../CLAUDE.md) |
| `data/` | Hold hand-transcribed, source-cited rows | Hold derived or generated numbers | `provenance.json`, [data-model.md](data-model.md) |
| `src/compute/` | Pure functions of `data/` plus the request | Use `fetch`, `process.env`, `Math.random`, or import from `agents/` or `acquire/` | `test/boundary.test.mjs` |
| `src/agents/` | Call an LLM, only through `provider.mjs` (ADR-013), and expose tools to agents | Write claims or numbers (it can only choose among compute outputs), call `fetch` outside `provider.mjs`, or cache a model reply | Enum-bound schema plus `validateSelection`, `test/boundary.test.mjs` |
| `src/api/` | Route, validate input, serve `web/` | Hold science logic | Review |
| `web/` | Render JSON, escape everything, run offline | Compute a claim, or load remote assets | CSP `default-src 'self'` |

`makeBrief` stamps `createdAt` with the wall clock. That's metadata, not science, and it is the one allowed non-determinism in compute.

## Request flow: "Will it burn on a Moon base at 34% oxygen?"

1. `web/app.js` → `GET /api/ask?q=…`
2. `server.mjs` → `ask()` in `scenario.mjs`
3. `parseQuestion` in `question.mjs` gives `{mission: moon, o2: 34}`. Every condition is given, omitted (a default shown as one), unresolved or unrecorded. `resolveScenario` then merges taps, the question and defaults. Here the Moon's default cabin air brings its 8.2 psi.
4. `applicability()` checks the material, gravity and air for the whole set, then every other given condition against each test's own row, all together (ADR-012). Gravity, O₂ and pressure fail.
5. The answer is built: verdict `no-data`, gap cards (each with a source), the closest tests when some conditions match, and `nearest` params that reach matching tests.
6. The browser draws the stamp, the checks table, the gap cards and the dashed flame (labelled "illustration").

## Offline design

- No remote fonts, scripts or tiles. Chart and flame are drawn locally with SVG and canvas.
- The core data is committed, so it never needs fetching.
- Any live enrichment (NTRS metadata, the PSI tables, and later FIRMS) goes through `safe.mjs` and returns a `source` label. A corrupt cache file falls through to the committed fixture.
- `OFFLINE=1` makes `safe.mjs` skip the network, and makes `provider.mjs` refuse every model call before anything leaves the machine. The research view says which mode is active.
- See [offline-demo.md](offline-demo.md).

## Why not the template's FastAPI stack?

The brief's repository layout suggests FastAPI. We kept the working, tested Node implementation and mapped its folders onto the template instead. See [decisions.md](decisions.md) ADR-001.

## Deployment

The server binds to `127.0.0.1` only. For judges, the plan is a static export of `web/` plus pre-computed JSON (see [roadmap](roadmap.md) R4), or a recorded demo. There is no public API server without auth and quotas.
