# Requirements

IDs are stable. Reference them in commits and tests, for example `FR-04: nearest-evidence jump`. Status values: ✅ built and tested, 🟡 partial, ⬜ not started.

## Functional

| ID | Requirement | Status | Verified by |
|---|---|---|---|
| FR-01 | A user can ask a plain-English cabin question and get a verdict in one step | ✅ | `test/scenario.test.mjs` |
| FR-02 | The reader extracts mission or place, cabin air, O₂ %, pressure (psi, kPa, atm, bar, mmHg), airflow (mm/s, cm/s, m/s, ft/s, km/h, mph), thickness, width and material, in normalised units. Each condition ends as *given*, *omitted* (the default applies and is shown as one), *unresolved* (malformed, contradictory or in an unknown unit) or *unrecorded* (a condition no table records), and shows as a Read-as chip. An explicitly supplied value is never swapped for a default, and a number no rule reads is unresolved, never dropped. | ✅ | `test/question.test.mjs` |
| FR-03 | Applicability (ADR-012): material, gravity and the station's air are checked at set level. Every other condition given is checked against each test's own row, all together, with no tolerance, interpolation or extrapolation. Pressure is never a measured match. Overall set bounds are context, derived from the data. | ✅ | `test/applicability.test.mjs` |
| FR-04 | A failed check returns **No data**, gap cards (each with a source URL), the closest tests with each recorded value and miss, and a nearest-evidence parameter set that reaches matching tests: **Burned**, **Mixed** or **No flame held** (tested for each kind of gap) | ✅ | `test/applicability.test.mjs`, scenario tests |
| FR-20 | An unresolved condition returns **Unclear**: no evidence, no rewritten question, and the reason for each unreadable condition. A tap after Unclear sends the question again, so it answers only if it replaces the unreadable condition, and nothing read from the unclear question travels as a tapped value. | ✅ | `test/question.test.mjs`, `test/frontend-home.test.mjs` |
| FR-21 | The home page keeps the user's newest intended scenario across fast taps, drops stale replies, shows neutral loading, unavailable and not-answered states, ties each answer to the question it answers, and draws a confident flame only for matched evidence | ✅ | `test/frontend-home.test.mjs` |
| FR-05 | Every number on screen opens the table row or cited source it came from | ✅ | manual check plus the evidence-number test |
| FR-06 | Search the 20 tests by text, test ID, thickness and O₂ range, with explained ranking | ✅ | `test/evidence.test.mjs` |
| FR-07 | Compare 2–3 tests, flag each differing condition, and never make a causal claim | ✅ | evidence tests |
| FR-08 | Export an evidence brief as Markdown with citations, or abstain | ✅ | evidence tests, `scripts/evaluate.mjs` |
| FR-09 | Refuse to rate safety, certify materials, or answer questions about untested fuels or environments. Explain why. | ✅ | eval cases |
| FR-10 | Optional AI can only select existing evidence IDs or abstain, and falls back visibly on any error, timeout or malformed reply. It is off offline, inside the provider boundary as well as at the route (ADR-013). | ✅ | `test/api-security.test.mjs` (mocked provider), `test/boundary.test.mjs`; live model run ⬜ |
| FR-11 | MCP server exposes `will_it_burn`, `search_evidence`, `compare_tests`, `evidence_brief` and `get_provenance`, enforces each tool's advertised schema, negotiates only supported protocol versions, and survives malformed input | ✅ | `test/mcp.test.mjs`, `test/boundary.test.mjs` |
| FR-12 | Every value fetched at run time shows its `live` / `cache` / `fixture` source. The home page's evidence comes from committed files in `data/`, so it must be labelled as committed data, never as live. | 🟡 | `src/acquire/safe.mjs` returns the source (the NTRS citation in `get_provenance` carries it); no UI badge yet |
| FR-13 | A provenance drawer shows the source, method, verification status and limitations | 🟡 | `/api/data` serves it; the drawer UI needs polish |
| FR-14 | The Bangladesh impact panel shows verified local fire numbers with sources | ⬜ | [roadmap](roadmap.md) R3 |
| FR-15 | The challenge name is stated on the landing page and the project page | 🟡 | in the README, and in the page footer on every section; the project page is still to do |
| FR-16 | Rank what the tests show by how consistently pairs of readings agree. Each finding says what is matched and what isn't (oxygen, for between-test pairs), shows its pair count beside its distinct-test count, says that pairs reuse readings, and opens its rows on tap. The tiers are labelled as the app's display rule, not a statistical test. Never presented as a causal claim or a safety ranking. | ✅ | `test/findings.test.mjs` |
| FR-19 | Show results from a separate experiment (Saffire-II) beside the answer, labelled as another experiment, computed from NASA's table, and never pooled into the verdict | ✅ | `test/saffire.test.mjs` |
| FR-18 | Answer SIBAL fabric and Nomex from their own test outcomes: **Mixed** with its reasons, or **No flame held** opening with "That isn’t a safety rating". Leave out reused samples as the report does, and never use an instrument reading as an airflow speed. | ✅ | `test/sets.test.mjs` |
| FR-17 | Quote NASA's documented ISS fire response word for word, in NASA's order, with its source and date, and show the microgravity evidence and its source for each step. Never reorder, merge, rank or reword the steps, and never turn a verdict into a danger level. | ✅ | `test/response.test.mjs` |

## Non-functional

| ID | Requirement | Status |
|---|---|---|
| NFR-01 | **Deterministic science.** `src/compute/` makes no network, LLM, env or random calls. A test enforces this. | ✅ |
| NFR-02 | **Offline.** The full demo works with `OFFLINE=1` and wifi off. Every public-data fetch goes through `src/acquire/safe.mjs`, and a corrupt cache file falls back to the committed fixture. Model calls go only through `src/agents/provider.mjs`, which refuses offline (ADR-013). | ✅ |
| NFR-03 | **No install.** Node 22+, zero npm dependencies | ✅ |
| NFR-04 | **Security.** Loopback bind only; the Host header must be one of the server's own loopback names (DNS-rebinding guard); cross-origin POST refused against the same list; request bodies type-checked; strict CSP; no inline script or style; output escaped; keys stay server-side and never enter a cache | ✅ |
| NFR-05 | **Honesty.** Missing stays `null`, never 0. Illustrations are labelled. Findings are labelled "descriptive, not a safety rating." | ✅ |
| NFR-06 | **Usability.** An untrained user gets an answer in 1 tap, a refined answer in 2 and the proof in 3 | ✅ design; ⬜ tested with users |
| NFR-07 | **Accessibility.** Keyboard reachable, colour-blind-safe ramp in both themes, respects reduced motion. Section links carry `aria-current`, and each section's heading takes focus when you switch. | ✅ |
| NFR-08 | **Performance.** `/api/ask` responds in under 50 ms locally (in memory, 20 rows) | ✅ |
| NFR-09 | **Reproducibility.** The data CSV and provenance JSON are committed, and the transcription method is documented. The 40 O₂ values are checked against NASA's own PSI-25 table (`test/psi.test.mjs`). | ✅ |

## Acceptance for submission

- [ ] Every FR row is ✅, or 🟡 with the gap stated on the project page
- [ ] `node --test` and `node scripts/evaluate.mjs` pass on a clean clone
- [ ] Demo recorded with wifi off ([offline-demo.md](offline-demo.md))
- [ ] Every Bangladesh number marked verified ([vision-and-scope.md](vision-and-scope.md))
- [ ] `docs/AI_USE.md` complete
- [ ] Repository opens for a stranger with no login
