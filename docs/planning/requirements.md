# Requirements

IDs are stable. Reference them in commits and tests, for example `FR-04: nearest-evidence jump`. Status values: ✅ built and tested, 🟡 partial, ⬜ not started.

## Functional

| ID | Requirement | Status | Verified by |
|---|---|---|---|
| FR-01 | A user can ask a plain-English cabin question and get a verdict in one step | ✅ | `test/scenario.test.mjs` |
| FR-02 | The reader extracts mission, cabin air, O₂ %, pressure (psi/kPa/atm), airflow, thickness and material, and shows each as a Read-as chip marked *question*, *picked* or *default* | ✅ | scenario tests |
| FR-03 | The cabin is checked against the evidence envelope (material, gravity, O₂, pressure, and airflow and thickness when given). The envelope is derived from the data, never typed in. | ✅ | `ENVELOPE` test |
| FR-04 | A failed check returns **No data**, gap cards (each with a source URL) and a nearest-evidence parameter set that always reaches **Burned** | ✅ | scenario tests |
| FR-05 | Every number on screen opens the table row or cited source it came from | ✅ | manual check plus the evidence-number test |
| FR-06 | Search the 20 tests by text, test ID, thickness and O₂ range, with explained ranking | ✅ | `test/evidence.test.mjs` |
| FR-07 | Compare 2–3 tests, flag each differing condition, and never make a causal claim | ✅ | evidence tests |
| FR-08 | Export an evidence brief as Markdown with citations, or abstain | ✅ | evidence tests, `scripts/evaluate.mjs` |
| FR-09 | Refuse to rate safety, certify materials, or answer questions about untested fuels or environments. Explain why. | ✅ | eval cases |
| FR-10 | Optional AI can only select existing evidence IDs or abstain, and falls back visibly on any error | ✅ | `test/boundary.test.mjs` (validation); live run ⬜ |
| FR-11 | MCP server exposes `will_it_burn`, `search_evidence`, `compare_tests`, `evidence_brief` and `get_provenance` | ✅ | `test/boundary.test.mjs` |
| FR-12 | Every fetched value shows a `live` / `cache` / `fixture` badge in the UI | 🟡 | `src/acquire/safe.mjs` returns it, but no UI badge yet |
| FR-13 | A provenance drawer shows the source, method, verification status and limitations | 🟡 | `/api/data` serves it; the drawer UI needs polish |
| FR-14 | The Bangladesh impact panel shows verified local fire numbers with sources | ⬜ | [roadmap](roadmap.md) R3 |
| FR-15 | The challenge name is stated on the landing page and the project page | 🟡 | in the README; add it to the UI |

## Non-functional

| ID | Requirement | Status |
|---|---|---|
| NFR-01 | **Deterministic science.** `src/compute/` makes no network, LLM, env or random calls. A test enforces this. | ✅ |
| NFR-02 | **Offline.** The full demo works with `OFFLINE=1` and wifi off. Every fetch goes through `src/acquire/safe.mjs`. | ✅ |
| NFR-03 | **No install.** Node 22+, zero npm dependencies | ✅ |
| NFR-04 | **Security.** Loopback bind only, strict CSP, no inline script or style, output escaped, keys stay server-side, cross-origin POST refused | ✅ |
| NFR-05 | **Honesty.** Missing stays `null`, never 0. Illustrations are labelled. Findings are labelled "descriptive, not a safety rating." | ✅ |
| NFR-06 | **Usability.** An untrained user gets an answer in 1 tap, a refined answer in 2 and the proof in 3 | ✅ design; ⬜ tested with users |
| NFR-07 | **Accessibility.** Keyboard reachable, colour-blind-safe ramp in both themes, respects reduced motion | ✅ |
| NFR-08 | **Performance.** `/api/ask` responds in under 50 ms locally (in memory, 20 rows) | ✅ |
| NFR-09 | **Reproducibility.** The data CSV and provenance JSON are committed, and the transcription method is documented | ✅ |

## Acceptance for submission

- [ ] Every FR row is ✅, or 🟡 with the gap stated on the project page
- [ ] `node --test` and `node scripts/evaluate.mjs` pass on a clean clone
- [ ] Demo recorded with wifi off ([offline-demo.md](offline-demo.md))
- [ ] Every Bangladesh number marked verified ([vision-and-scope.md](vision-and-scope.md))
- [ ] `docs/AI_USE.md` complete
- [ ] Repository opens for a stranger with no login
