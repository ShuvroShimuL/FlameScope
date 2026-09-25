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

**Status:** Accepted. Its fallback rule is superseded by ADR-012: unreadable conditions are now unresolved, not defaulted.

**Decision.** `parseQuestion` uses tested patterns. Unknown phrasing falls back to defaults, and a notice says so.

**Consequences.** + Predictable, offline and testable. − Narrower language coverage. Any future LLM reader may only fill the same schema, with the rules as the fallback.

## ADR-004 · The LLM may select, never write

**Status:** Accepted

**Decision.** The only LLM call returns `{ids, abstain}` bound to an enum of offered IDs. Output text always comes from compute.

**Consequences.** + No hallucinated numbers or safety claims can reach the UI. − Less "wow" than free-form chat. We compensate with the MCP and orchestrator story ([agentic-design](agentic-design.md)).

## ADR-005 · "No data" is a first-class answer

**Status:** Accepted. The envelope check it describes is superseded by the joint, per-test policy in ADR-012.

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

## ADR-011 · One evidence set per tested material, and outcome verdicts

**Status:** Accepted · 2026-09-24

**Context.** The same BASS-II report holds more than the acrylic spread rates: SIBAL fabric outcomes (Table 7.1), three Nomex tests (Table A.2) and extinction speeds (Table 2.1). Some fabric samples didn't ignite, and no flame held on Nomex. A Burned or No data answer can't say that, and answering "No data" for Nomex on the ISS would be false.

**Decision.** Each tested material gets its own evidence set, with an envelope derived from its own rows. Fabric and Nomex answers come from outcomes. **Mixed** gives the count and the reasons. **No flame held** always opens with "That isn’t a safety rating". Reused samples stay out, as the report says. Nomex airflow is an instrument reading, so it never matches a cm/s question. Cotton and plain fabric stay **No data**, and they point to SIBAL as the nearest evidence, not as a stand-in.

**Consequences.**
- \+ Real answers for two more materials, from the report we already cite.
- \+ The first "did not ignite" results, shown honestly.
- − "No flame held" could be misread as "safe". The copy, the tests and the neutral stamp guard against that.
- − The outcome labels are our reading of the report's comments, so they need the second-person check.

## ADR-012 · Applicability: every condition checked together, against each test's own row

**Status:** Accepted · 2026-09-24, pending team review. Supersedes the envelope check in ADR-005 and the "falls back to defaults" rule in ADR-003.

**Context.** The first version checked each condition against the whole set's range on its own, then answered from every test with the right thickness. An audit showed two wrong affirmative answers:
- A 1 mm sheet at 16.8% O₂ and 21 cm/s got **Burned, 4 of 4**. None of those four tests ran at 16.8% or at 21 cm/s; each value was only somewhere in the set.
- SIBAL at 21% O₂ and 53 cm/s got **Burned**, citing a test that ran at 16.9%.

The reader also swapped explicit but unsupported conditions for defaults: steel became acrylic, Earth became the ISS, and 0% O₂ became 21%.

**Decision.** `src/compute/applicability.mjs` applies one policy:
1. **Set-level conditions** come from how an experiment ran: the material, microgravity aboard the ISS, and the station's own air in a glovebox. A cabin-air preset is matched at this level and shown as "station air" (context), not as a measured oxygen match.
2. **Pressure is never a measured match.** No table records it. Only the station's nominal cabin pressure (14.7 psi, 1 atm) is consistent with how the tests ran, and it is shown as "Not recorded". Any other pressure is a gap. No tolerance is added.
3. **Every other condition you give is checked against each test's own row, all together.** A test counts only if its row records every one of them. The set's overall bounds are context for headlines and never a match.
4. **Recorded, as the table records it.** Acrylic airflow must be one of the values a test was set to. Acrylic oxygen must lie within the test's start-to-end span; the table gives only the endpoints, so the span is "passed through during the burn", never a constant level. A fabric flow such as "10 to 5" is a ramp the report says was changed at varying rates, so the values in between were passed through. Its outcome at the end of the ramp is the quench or blow-off the report names. A fabric test's single oxygen value must match exactly.
5. **Oxygen and airflow are never tied together within one acrylic test.** The table can't say what the oxygen was at a given airflow reading.
6. **Misses stay visible.** A test that records some conditions but not all is listed as one of the closest tests, with each recorded value and each miss. It is never counted as a match. "No single test had all of these conditions" is its own answer.
7. **The reader never answers for a value it didn't read.** A question's conditions are given, omitted (the default applies and is shown as one), unresolved (malformed, contradictory or in an unknown unit: the answer is **Unclear**) or unrecorded (a condition no table records, such as temperature, which blocks an affirmative answer). A number the reader can't place is unresolved too, and a tap after Unclear sends the question again, so nothing read from an unclear question reaches an answer. Named places and materials outside the data stay what was asked and answer **No data**.

**Consequences.**
- \+ No affirmative verdict rests on conditions no single test recorded, and every answer can be traced to specific rows.
- \+ New tests pin the audit cases and each failure class (`test/applicability.test.mjs`, `test/question.test.mjs`).
- − More questions answer No data, for example an airflow between two set values. The gap card names the nearest set values and their tests, and the nearest-evidence button still lands on matching tests.
- − Exact matching is strict by design. Any future tolerance needs its own ADR and a documented measurement basis, such as a stated instrument uncertainty.

## ADR-013 · Model calls cross their own boundary, never the public-data cache

**Status:** Accepted · 2026-09-24, pending team review. Refines rule 5 in AGENTS.md.

**Context.** Rule 5 says every fetch goes through `src/acquire/safe.mjs`, which caches responses and falls back to fixtures. The optional evidence selector called the model provider directly, with no internal offline guard; only the HTTP route stopped it offline. Routing an authenticated model request through a public-data cache would be wrong in the other direction: replies would go stale, and a cache file could hold request context.

**Decision.** Public data keeps using `safe.mjs`. Authenticated model calls go only through `src/agents/provider.mjs`, which:
- refuses offline or without a key before anything leaves the machine;
- sends the key only in the Authorization header, and never puts it in an error message;
- writes nothing to disk and times out every call;
- lets tests replace its transport, so no test makes a real or billable call.

`test/boundary.test.mjs` checks that no other agent file calls `fetch(` directly, and that no acquire module carries model credentials.

**Consequences.**
- \+ The offline guarantee holds even if a route forgets its gate, and the key can't reach a cache file.
- − Two network boundaries to document instead of one. AGENTS.md rule 5 now names both.

## ADR-014 · A hosted copy on Vercel, beside the local server

**Status:** Proposed · 2026-09-25, pending team review. Answers Q3.

**Context.** The team wants a link judges and teammates can open without running the app. GitHub Pages serves only static files, but answers are computed on the server (`/api/ask`, `/api/compare`, `/api/brief`), `src/compute` reads `data/` with `readFileSync`, and a planned chatbot needs a model key that must stay server-side (rule 7). The local server also refused every Host but loopback, to stop DNS rebinding.

**Decision.** Keep one handler and host it on Vercel:
- `src/api/server.mjs` exports `createHandler()`. `createServer()` wraps it locally, and `api/index.mjs` exports it as a Vercel function.
- `vercel.json` serves `web/` as static files with the same CSP and `nosniff` headers as the server (`test/deploy.test.mjs` keeps them equal), sends every other path to the function, and bundles `data/` with it.
- The Host check still refuses unknown names. It also accepts `PUBLIC_HOSTS` and the names Vercel sets (`VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL`), and a published name counts as an Origin only over https.
- `HOST` sets the bind address for a container host such as Render. It defaults to `127.0.0.1`.

**Consequences.**
- + One link for judges, with no install. The science and its boundaries are unchanged, and no dependency is added.
- + Render or any Node host works with `HOST=0.0.0.0` and `PUBLIC_HOSTS`.
- − The live demo still runs locally with `OFFLINE=1`, since venue wifi can fail (rule 6). The hosted copy is the second path.
- − A public model key could be spent by anyone. Until the chatbot has a limit, deploy without one, or give the key a spending cap at the provider.
- − The Vercel config is only proven by a real deploy; the tests cover the handler and the headers.

---

## Open questions

- **Q1.** What is the Bangladesh framing: the method only ("evidence envelope"), or also a FIRMS fire layer? Decide at M1. See [roadmap](roadmap.md) R3.
- **Q2.** Should Saffire or SoFIE be the second evidence set? It depends on whether the numbers are published in tables.
- **Q3.** Hosting for judges: a static export on GitHub Pages, or video only? *Proposed in ADR-014: Vercel, running the same server.*
