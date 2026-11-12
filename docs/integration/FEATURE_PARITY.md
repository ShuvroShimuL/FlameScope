# Feature parity: FlameScope v1 and HEARTH

A capability counts as present when the behaviour exists, whatever it is called or wherever it lives.
Evidence is given as `file:line` or a test; "v1" paths are at commit `fdce8c5`, HEARTH paths at `ccc64ac`.

Decisions: **KEEP_HEARTH** (HEARTH's version stays) · **PORT_FROM_FLAMESCOPE** (moved in with its rules intact) ·
**ADAPT_OR_IMPROVE** (rebuilt or changed to fit) · **DEFER** (worth doing, not in this branch) ·
**REJECT** (not carried over).

## 1. Matrix

### A. Application

| Feature | FlameScope v1 | HEARTH | Gap | Value | Risk | Decision | Evidence |
|---|---|---|---|---|---|---|---|
| Dashboard and navigation | one page with five hash tabs | 8 routed pages, side nav, top bar | none | high | low | KEEP_HEARTH | `components/layout/SideNav.tsx` |
| Mission selection | 4 tiles: ISS, Moon base, Mars transit, Mars base | 4 chips: ISS, Moon base, lunar rover, spacesuit | different catalogues and different "Moon base" air | high | high if merged | KEEP_HEARTH for the app; PORT the tiles inside one page, labelled with their air | `lib/missions.ts:17-32`, `lib/evidence/catalog.mjs:20-29` |
| Dataset exploration, filter, sort | search over 20 rows, two filters | filter by investigation, phase, O2, text; sortable paged table; drawer | none | high | low | KEEP_HEARTH | `components/explorer/Explorer.tsx` |
| Test-level comparison | compare 2 or 3 acrylic rows with "differs" tags | compare 2 or 3 investigations | v1 compares rows, HEARTH compares investigations | medium | medium | DEFER (engine functions kept and exposed through MCP) | `lib/evidence/evidence.mjs:45-60` |
| Fire visualisation | one labelled illustration canvas | 3D map, WebGL flame simulator, backdrop | none | low | low | KEEP_HEARTH; REJECT the v1 canvas | `components/flame/`, `components/map3d/` |
| Safety analysis and gaps | sourced gap cards per answer | six heuristic rules, gap heatmap | different kinds of answer | high | medium | KEEP_HEARTH, with overclaims corrected; PORT the gap cards inside the new page | `lib/safety.ts`, `lib/evidence/scenario.mjs:115-176` |
| Saved questions | last 50, this browser only, never an answer | none (only preferences are stored) | **missing** | medium | low | PORT_FROM_FLAMESCOPE | `lib/evidence/client/library.mjs`, `lib/store.ts:134` |
| Markdown export | evidence brief from the research view | none | **missing** | medium | low | ADAPT_OR_IMPROVE (now covers every verdict) | `lib/evidence/client/brief.mjs` |
| JSON and CSV export | none | dataset downloads, split builder | none | medium | low | KEEP_HEARTH | `app/api/dataset/[file]/route.ts` |
| Data lab | none | own conditions, CSV upload kept in the browser, DEMO telemetry | none | medium | low | KEEP_HEARTH | `components/lab/LabView.tsx` |
| Scientific report | evidence brief | none | covered by the brief | medium | low | ADAPT_OR_IMPROVE | as above |
| Offline use | whole app offline, `OFFLINE=1` | Offline engine always available; no network needed at run time except optional model calls | none in substance | high | low | KEEP_HEARTH | `lib/vesta/offline.ts` |
| Research documentation and citations | provenance JSON per table, sources tab | Dataset page, DATA_NOTES, source chips | none | high | low | KEEP both | `data/evidence/*.provenance.json`, `app/dataset/page.tsx` |
| Light and dark themes | both, with a toggle | dark only | v1 light theme is lost | low | medium | REJECT (a second palette for 8 pages, charts and WebGL is out of scope) | `app/globals.css:21` |
| Accessibility | native `<dialog>`, labelled controls | skip link, focus ring, labels; two modals without focus handling | HEARTH defects | high | low | ADAPT_OR_IMPROVE | `components/ui/useModalFocus.ts` |

### B. NASA data and science

| Feature | FlameScope v1 | HEARTH | Gap | Value | Risk | Decision | Evidence |
|---|---|---|---|---|---|---|---|
| ACME, CFI, SPICE | not used | 889 rows, 847 after 42 flagged repeats | none | high | low | KEEP_HEARTH | `data/processed/tests.json` |
| BASS-II solids | 20 acrylic, 23 usable fabric (4 from BASS), 3 Nomex | none: "no solid tests" | **missing** | high | medium | PORT_FROM_FLAMESCOPE as a separate set | `data/evidence/` |
| FLEX (PSI-69) | 274 rows, used for one fire-response line | CFI covers n-dodecane droplets | partly different | low | low | PORT (as supporting data only) | `lib/evidence/flex.mjs` |
| Saffire-II (PSI-99) | 9 samples, shown beside answers only | none | missing | medium | low | PORT (beside answers, never in a verdict) | `lib/evidence/saffire.mjs` |
| SAME | citation only | none | none | low | low | KEEP as a citation | `data/evidence/fire-response.json` |
| Schema, units, source rows | per-row `sourceLocation`; units kept in CSV | per-row `source_file` and `source_row`; units converted on ingest | none | high | low | KEEP both, separate | `docs/DATA_NOTES.md` |
| Quality flags | `missing[]` per row, `o2_note` | `duplicate_row`, `layout_shifted`, `conditions_from_doc` | none | high | low | KEEP both | `lib/types.ts` |
| Missing-data handling | `null`, listed in `missing[]`, never 0 | `null`; but omitted O2 or pressure filled from the active mission | HEARTH default-fill | high | medium | KEEP_HEARTH for gas tools; the solid tool never borrows | `lib/vesta/offline.ts:124`, `tests/will-it-burn.test.ts` |
| Condition-aware matching | same-row, no tolerance | neighbourhood count | **different rule** | high | high | PORT_FROM_FLAMESCOPE for solids; KEEP_HEARTH for gas | `lib/evidence/applicability.mjs`, `lib/physics.ts:95` |
| Formula validation | two arithmetic reproductions | tested pO2, ratios, conversions | none | high | low | KEEP both | `tests/physics.test.ts`, `tests/evidence/evidence.test.mjs` |
| Confidence and uncertainty | no label; counts and caveats | supported / extrapolated / no_data | mapping needed | medium | medium | ADAPT_OR_IMPROVE | `lib/vesta/tools/will_it_burn.ts` |
| Reproducible evaluation | 20 retrieval and abstention cases | 16 VESTA questions, 12 scored offline | none | medium | low | KEEP both; 4 solid questions added | `scripts/evaluate-evidence.mjs`, `evals/questions.yaml` |

### C. AI and VESTA

| Feature | FlameScope v1 | HEARTH | Gap | Value | Risk | Decision | Evidence |
|---|---|---|---|---|---|---|---|
| Assistant with tools | none | VESTA, 11 tools | none | high | low | KEEP_HEARTH | `lib/vesta/tools/index.ts` |
| Provider chain and fallback | one provider, optional | 6 providers then Offline, cooldowns | none | high | low | KEEP_HEARTH | `lib/vesta/router.ts` |
| Offline answers | deterministic by design | rule-based intent router | solids were unanswerable | high | medium | ADAPT_OR_IMPROVE (new `burn` intent) | `lib/vesta/offline.ts` |
| Grounding | model may only select IDs | numbers checked against tool results; unverified answers ship with a note | weaker rule | high | high | KEEP_HEARTH; the solid tool adds no number and caps confidence | `lib/vesta/agent.ts:136-160` |
| Streaming, charts, UI actions | none | SSE, `make_chart`, `ui_action` | none | high | low | KEEP_HEARTH; one view added | `lib/vesta/tools/ui_action.ts` |
| Rate limits and errors | none needed | per-visitor limiter, busy set, friendly errors | none | medium | low | KEEP_HEARTH | `lib/ratelimit.ts` |
| Engine room | none | engine picker, token meter | none | medium | low | KEEP_HEARTH | `components/vesta/EngineRoom.tsx` |
| Constrained evidence selector | OpenAI picks row IDs | not needed | none | low | medium | REJECT (a second AI path sharing `OPENAI_*`) | v1 `src/agents/` |
| MCP research tools | 5 read-only tools over stdio | none | **missing** | medium | low | PORT_FROM_FLAMESCOPE (network call removed) | `scripts/mcp-server.mjs` |

### D. Engineering

| Feature | FlameScope v1 | HEARTH | Gap | Value | Risk | Decision | Evidence |
|---|---|---|---|---|---|---|---|
| Framework | none | Next.js 14 | none | high | low | KEEP_HEARTH | `package.json` |
| API contracts | `/api/ask`, `/api/data`, `/api/search`, `/api/compare`, `/api/brief` | 16 routes; `/api/search` and `/api/compare` mean something else | name collisions | high | medium | ADAPT_OR_IMPROVE: `/api/burn/ask`, `/api/burn/data` | `app/api/burn/` |
| Tests | 21 suites, node:test | 14 suites, vitest | two runners | high | medium | ADAPT_OR_IMPROVE: one runner | `vitest.config.ts` |
| Security boundaries | Host list, Origin check, strict CSP | none of these | **missing** | high | medium | PORT the Origin check; ADAPT the headers; DEFER the rest | `lib/api.ts`, `next.config.mjs` |
| Deterministic-code boundary | enforced by a test | none | missing | high | low | PORT_FROM_FLAMESCOPE | `tests/evidence/boundary.test.mjs` |
| Runtime NASA fetch (live, cache, fixture) | yes | no: committed data only | different model | low | medium | REJECT; fixtures kept for offline cross-checks | `data/evidence/fixtures/` |
| Secrets | env only | env only; engines route returns no key material | none | high | low | KEEP_HEARTH | `app/api/vesta/engines/route.ts` |
| Generated system map | none | Blueprint, kept in step by tests | none | medium | low | KEEP_HEARTH, extended | `scripts/blueprint/` |
| CI | none | none | missing in both | high | low | DEFER | n/a |
| Error monitoring | none | none | missing in both | medium | low | DEFER | n/a |

## 2. The eleven capabilities named for special attention

| # | Capability | Did HEARTH have it? | Decision |
|---|---|---|---|
| 1 | Deterministic condition-aware question parsing | **Partly.** `parseMessage` took the first `%`, one pressure, one cm/s and a mission word; it ignored material, thickness and gravity, and nothing was ever "unresolved". | PORT |
| 2 | Several conditions matched within the same source row | **No.** `envelopeCheck` counts rows inside a window, pooled across fuels and investigations. | PORT |
| 3 | Explicit explanation of unsupported conditions | **Partly.** Generic gap lines; no per-condition "yours against recorded". | PORT |
| 4 | "No data", "Unclear" and mixed outcomes | **Partly.** supported / sparse / no_data only. | PORT |
| 5 | BASS-II solid-material evidence | **No.** | PORT |
| 6 | Source-linked evidence brief with Markdown export | **No.** | ADAPT |
| 7 | Saved research questions | **No.** | PORT |
| 8 | "Read as" feedback | **No.** | PORT |
| 9 | Offline retrieval and reproducible evaluation | **Yes**, for its own data. | KEEP both |
| 10 | Read-only research tools and provenance checks | **Partly.** In-app data tools; no MCP server and no provenance tool. | PORT |
| 11 | Fire-response research and evidence summaries | **No.** A different heuristic audit. | PORT |

## 3. Each gap that was closed

### 3.1 Solid-material evidence with same-row matching (items 1 to 5, 8)

- **User benefit:** a crew-habitat question about an actual material ("Will a 1 mm acrylic sheet burn on the ISS
  with 10 cm/s of airflow?") gets an answer from NASA rows, or a named gap, where the app used to say no
  solid data exists.
- **Scientific benefit:** conditions are never mixed across tests; an unread or unrecorded condition stops the
  answer instead of being replaced.
- **Complexity:** medium. About 1,230 lines of rule code moved unchanged; the page and tool are new.
- **Regression risk:** medium, from running a file-reading module under a bundler and from two rulebooks
  sharing one screen.
- **Method:** engine moved to `lib/evidence/` with one loader; typed front doors `lib/burn.ts` and
  `lib/evidence/client/index.ts`; routes under `/api/burn/`; page `/burn`; rows kept out of `tests.json`.
- **Acceptance:** the 15 ported suites pass under vitest; `scripts/evaluate-evidence.mjs` is 20/20;
  `tests/burn-api.test.ts` covers each verdict, bad requests and the separation of the two data sets;
  the production build traces the data files into the routes. **Met.**

### 3.2 Markdown evidence brief (item 6)

- **Benefit:** a shareable, source-linked record of one answer, including No data and Unclear answers, which
  v1's brief refused.
- **Complexity:** low. **Risk:** low; it is a pure function of the answer.
- **Acceptance:** every row and source link present; untracked spread written as "Not tracked"; no number that
  is not in the answer, the cited rows or the date; only `http(s)` links; a safe file name. **Met**
  (`tests/evidence/brief.test.mjs`, 9 tests).

### 3.3 Saved questions (item 7)

- **Benefit:** return to earlier questions; each reopening recomputes from the current rows.
- **Complexity:** low: the v1 module is reused as is. **Risk:** low.
- **Acceptance:** only question and request are stored, never an answer; malformed storage is ignored; storage
  failure leaves a working list. **Met** (`tests/evidence/library.test.mjs`, and checked in the browser).

### 3.4 VESTA can answer solid questions (items 1, 4, 5)

- **Benefit:** the assistant no longer denies evidence the product holds.
- **Scientific benefit:** the tool passes the engine's answer on and adds no number; its confidence caps the
  answer's; it never takes a condition from the active mission.
- **Complexity:** medium (tool, Offline intent, prompt, dashboard action). **Risk:** medium: intent routing
  could capture gas questions.
- **Acceptance:** 20 tests in `tests/will-it-burn.test.ts`, including an AI-engine run in which an invented
  number is flagged and "supported" cannot be claimed over a no-data result; Offline evals 16 of 16. **Met.**

### 3.5 Read-only research tools (item 10)

- **Benefit:** any MCP client can query the evidence without being able to invent it.
- **Change:** `get_provenance` reads the committed NTRS record and labels it `fixture`; no network call.
- **Acceptance:** protocol and schema tests pass; a test asserts the server has no network or model code. **Met.**

### 3.6 Fire-response evidence (item 11)

- **Benefit:** NASA's own eight steps, quoted in NASA's order, each with the microgravity evidence found for it.
- **Risk:** low; the quotes and sources are data, and one line is computed from the rows.
- **Acceptance:** `tests/evidence/response.test.mjs`; rendered on the page with every source linked. **Met.**

### 3.7 Request hardening and keyboard focus

- **Benefit:** another site cannot spend this server's model keys through a visitor's browser; keyboard users
  are not dropped out of a dialog.
- **Acceptance:** `tests/security.test.ts` (8 tests); focus behaviour checked in the browser. **Met.**

## 4. Deferred, with what would close each

| Item | Why deferred | Acceptance when done |
|---|---|---|
| One mission catalogue with sourced atmospheres | "Moon base" is 30% O2 at 10.2 psi in one catalogue and 34% at 8.2 psi in the other, and each is tested. Choosing one is a science decision for the team. | Each mission's atmosphere cites a source; one catalogue serves both rulebooks; no test encodes two values for one name. |
| Row-level comparison of BASS-II tests in the UI | Would add a second comparison screen beside Compare. The engine functions exist. | Compare page offers BASS-II rows as their own mode, with "differs" tags and the engine's caveats. |
| Composition of the gas "envelope" | 435 of the 518 rows near ISS conditions carry documented, not measured, oxygen and pressure (SPICE); the rows near Moon-base air are ACME inverse flames whose oxygen is the burner stream. Changing the rule changes a core HEARTH result. | `envelope_check` reports measured, documented and inverse-layout rows separately, and the UI shows the split. |
| Saffire IV to VI data at reduced pressure and raised oxygen | A new dataset; needs transcription and a second-person check. | Rows with provenance, two reproduced values, their own evidence set. |
| Provenance for the nine ACME, CFI and SPICE source files | PSI identifiers, DOIs, access dates and licences are not recorded. | `data/processed/sources.json` carries them, checked against psi.nasa.gov. |
| CI | Neither repository has any. | A workflow runs lint, types, tests, the evaluation and the build on every pull request. |
| A browser test suite | None exists; this branch was checked by hand through automation. | Playwright runs the viewport matrix and the dialog focus checks in Chromium, Firefox and WebKit. |
| Open Graph image and installable icons | Text metadata is in place; an image needs design sign-off. | A 1200 × 630 image and PNG icons generated from the brand module. |
| Rate limiting that survives more than one server instance | In-memory limiter, HEARTH's design. | A shared store, or a documented single-instance deployment. |

## 5. Rejected

| Item | Reason |
|---|---|
| v1 static pages, HTTP server, Vercel entry | A second application root. `vercel.json`'s rewrite and output directory would have hidden the Next.js app. |
| v1 OpenAI evidence selector and provider | A second AI path, sharing `OPENAI_*` with VESTA's ChatGPT engine. VESTA replaces it. |
| Runtime NASA fetch layer (`src/acquire`) | The unified app reads committed data only. The fetched files it needs are committed as fixtures. |
| v1 research view | Duplicates the explorer and would add a second question box. Its brief export survives in adapted form. |
| v1 flame illustration canvas | HEARTH has four animated flames; a fifth adds nothing. |
| Light theme | See section 1A. |
| Merging BASS-II rows into `tests.json` | The two sets record oxygen, pressure and airflow in ways that cannot share one table. |
| Recolouring the interface blue | Ember is also a data colour; blue sits too close to the ACME and CFI series. Only the product mark is blue. |
