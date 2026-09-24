# Decisions (ADR log)

Lightweight architecture decision records. Add new ones at the bottom, and never edit an accepted one: supersede it instead. Format: context → decision → consequences.

---

## ADR-001 · Keep Node.js; map the template layout onto it

**Status:** Accepted · 2026-09-23

**Context.** The brief's repository layout suggests FastAPI under `src/api/`. We already have a working, tested, zero-dependency Node 22 app (21 tests, 20/20 eval).

**Decision.** Keep Node, and adopt the template's *folders and boundaries*: `src/acquire`, `src/compute`, `src/agents`, `src/api` and `web/`. Port `safe.py` to `src/acquire/safe.mjs` with identical semantics.

**Consequences.** + There's no rewrite risk, and the no-install run is preserved. + Judges still see the expected layout. − The Python snippets in the brief need translating. Any Python analysis goes in `scripts/` and must write committed JSON that compute reads.

## ADR-002 · Hand-transcribed data, not runtime download

**Status:** Accepted

**Context.** The BASS-II numbers exist in a PDF table. The PSI raw archive isn't needed for the table values.

**Decision.** Transcribe Table 5.1 into `data/bass-table.csv`, with `provenance.json` recording the method, the verification status and the limits. Live fetches are only for metadata and enrichment, through `safe.mjs`.

**Consequences.** + Fully offline, and every value points to a page and row. − Transcription errors are possible. Mitigation: a second-person PDF check (reviewer protocol) and reproduction tests.

## ADR-003 · Rule-based question reader, not an LLM

**Status:** Accepted

**Decision.** `parseQuestion` uses tested patterns. Unknown phrasing falls back to defaults, and a notice says so.

**Consequences.** + Predictable, offline and testable. − Narrower language coverage. Any future LLM reader may only fill the same schema, with the rules as the fallback.

## ADR-004 · The LLM may select, never write

**Status:** Accepted

**Decision.** The only LLM call returns `{ids, abstain}` bound to an enum of offered IDs. Output text always comes from compute.

**Consequences.** + No hallucinated numbers or safety claims can reach the UI. − Less "wow" than free-form chat. We compensate with the MCP and orchestrator story ([agentic-design](agentic-design.md)).

## ADR-005 · "No data" is a first-class answer

**Status:** Accepted

**Decision.** Out-of-envelope scenarios return `no-data`, with sourced gap cards and a nearest-evidence jump. We never extrapolate.

**Consequences.** + Scientifically honest, and it makes NASA's own coverage gaps visible. − It must be explained on camera ("a gap is an answer").

## ADR-006 · Expose compute as an MCP server

**Status:** Accepted · 2026-09-23

**Decision.** Ship a dependency-free stdio MCP server with five read-only tools, registered in `.mcp.json`.

**Consequences.** + Any agent can use the evidence safely. It's a creative, demoable "agentic" surface. − We have to keep its protocol handling in sync with the MCP spec by hand (there's no SDK).

## ADR-007 · No unverified number on camera

**Status:** Accepted · 2026-09-23

**Decision.** Every figure used for impact framing (Bangladesh or otherwise) needs a primary-source link and a second-person check before it goes on the project page or into the video.

**Consequences.** The Impact story may use fewer numbers, but every one of them holds up.

## ADR-008 · Offline-first demo

**Status:** Accepted · 2026-09-23

**Decision.** Follow the brief's offline safety net: every fetch goes through `safe.mjs`, the `OFFLINE=1` flag, committed `demo_fixtures/`, no remote assets, pre-computed JSON for a static build, and a recording made with wifi off.

**Consequences.** + The demo can't fail on venue wifi. − Fixtures must be refreshed when an acquire module changes.

## ADR-009 · Will It Burn? is the primary product

**Status:** Accepted · 2026-09-23

**Context.** The team prefers the question-first Will It Burn? dashboard over the FlameScope research view.

**Decision.** New features, the demo and the project page centre on Will It Burn?, now served at `/` (old `/burn/` links redirect). FlameScope moved to `/research/` and stays available as a secondary research view and shares the same compute core, but it gets no new features unless Will It Burn? needs them. [features.md](features.md) is the single list of what Will It Burn? does.

**Consequences.** + A clearer story for judges and one place to polish. − The research-view backlog (search, compare, export) is frozen. Done 2026-09-23: `/` serves Will It Burn?.

## ADR-010 · Quote NASA's fire response; never write or rank the steps

**Status:** Accepted · 2026-09-24

**Context.** The team proposed ranking the steps to take when there is danger. An app that writes or ranks those steps would break rule 1 (science is computed, never generated) and rule 4 (no safety rating). The challenge asks us to rank *findings*, not actions. NASA does publish an ordered ISS fire response: OCHMO-TB-008 Rev A (29 Nov 2023) lists eight steps "taken sequentially by the crew". The microgravity evidence behind those steps is mixed or missing ([datasets.md](datasets.md) §3).

**Decision.** Quote NASA's list word for word, in NASA's order, with its source and date. It sits in its own section, which looks the same for every answer. Next to each step, show the microgravity evidence we found, each line with its source, and a status from a fixed list. Never reorder, merge, rank or reword the steps. Never write in the imperative outside NASA's quotes, and never turn a verdict into a danger level. Where another NASA source describes a step differently, say so and cite it.

**Consequences.**
- \+ It gives a fire-safety insight with no generated advice.
- \+ It adds a new "a gap is an answer" moment: two steps have no microgravity data, and ventilation shutdown has mixed evidence.
- − One dated brief can go stale, so re-check it against newer NASA text before submission.
- − The evidence statuses are our judgment, so they need the second-person check.

---

## Open questions

- **Q1.** What is the Bangladesh framing: the method only ("evidence envelope"), or also a FIRMS fire layer? Decide at M1. See [roadmap](roadmap.md) R3.
- **Q2.** Should Saffire or SoFIE be the second evidence set? It depends on whether the numbers are published in tables.
- **Q3.** Hosting for judges: a static export on GitHub Pages, or video only?
