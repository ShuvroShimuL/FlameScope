# FlameScope

Local, report-backed BASS-II evidence explorer for researchers and engineers. Search 20 PMMA sheet tests, compare their conditions, and export a source-linked brief. Every number on screen traces to one printed page of one NASA report.

## Run

Requires Node.js 22+; no packages or install step needed.

```powershell
node server.mjs
```

Open http://127.0.0.1:3000 for FlameScope and http://127.0.0.1:3000/burn/ for the Will It Burn? view. `node --test` runs 21 data-contract, API, question-reader and frontend-state checks. `node scripts/evaluate.mjs` runs 20 offline retrieval/abstention cases. Equivalent npm scripts exist, but this machine's npm launcher is broken; the direct Node commands work without npm.

## Will It Burn? (question-first view)

A second front end on the same 20 BASS-II rows, at `/burn/`. Type a question such as "Will it burn on a Moon base at 34% oxygen?", tap a suggested question, or tap a mission. The page checks your cabin's gravity, oxygen, pressure, airflow and thickness against what the NASA tests covered. It then answers **Burned** with the evidence, or **No data** with what's missing and where that data may exist. Every number opens its source row.

- [docs/will-it-burn-concept.md](docs/will-it-burn-concept.md): the idea, what users can type, the three taps, and why it is designed this way.
- [docs/will-it-burn-technical.md](docs/will-it-burn-technical.md): where the data comes from, how the search reads a question, the `/api/ask` contract, and how the JSON becomes the dashboard.

## The three-step journey

The page is one flow — **1 Find evidence → 2 Compare tests → 3 Evidence brief** — and never hides where you are:

- A **step bar** at the top doubles as navigation and live status: each step shows its own state ("12 tests found", "2 selected", "Ready to export") and lights up once that step is satisfied.
- A **tray pinned to the bottom** always holds the current selection as removable chips plus the single next action. Buttons stay disabled, with the reason in the tray, until the step is actually possible.
- Steps are addressable (`#ask`, `#compare`, `#brief`), so the browser **Back button** moves between them.
- Editing the question or a filter marks the search stale and blocks a brief until you re-run it, so an exported brief can never describe evidence you are no longer looking at. Out-of-order responses are versioned and discarded.

## Three essential features

1. **Evidence retrieval:** natural-language keyword/test-ID search plus thickness and initial-oxygen filters that apply as they change, with an active-filter count and one-click clear. The material, geometry and flow-direction filters remain in the API but are not shown in the UI, because the subset has a single value for each. Ranking is deterministic: requested test IDs, availability of measurements, stable test-ID tie break. Each card explains why it ranked and what is missing from it. All records have equal source traceability. This is not a safety score or a semantic scientific reasoning engine.
2. **Condition-aware comparison:** select 2–3 tests. Material, dimensions, burning sides, flow, O₂ endpoints and missing quantities remain explicit, and rows that differ between tests are tagged `differs`. All comparisons are descriptive, never causal.
3. **Evidence brief:** published measurements, conditions, template interpretation and evidence gaps; export Markdown with citations. Runs offline after the local server starts, without remote fonts or libraries.

## Optional AI mode

Copy `.env.example` to `.env`, set `OPENAI_API_KEY`, then run `node --env-file=.env server.mjs`. Alternatively set the variables in your shell. Keys stay on the server; never add `.env` to source control. `OPENAI_MODEL` defaults to `gpt-4.1-mini` and can be changed to a model supporting Responses structured output.

The UI AI checkbox sends the research question and selected public evidence to OpenAI. The model can only select existing evidence IDs or abstain. It cannot write scientific claims or numbers. Output is rendered from the curated records; interpretation remains a deterministic template. Provider errors/timeouts fall back to a visibly labeled offline brief. This constrained AI selection is intentionally narrower than free-form LLM synthesis. No live model calls are made unless the user checks the AI option and a key is configured.

## Data provenance and limits

- Source: [NASA/TM-20210011385](https://ntrs.nasa.gov/citations/20210011385), Table 5.1, **printed p. 57**. PMMA sheets and opposed flow: section 5.3, printed p. 56.
- `data/bass-table.csv` preserves reported velocity/spread pairs. Semicolon-separated values correspond by position. Empty spread cells for M6/M12 mean **Not tracked**, not zero.
- Source width in cm is normalized to mm; flow stays cm/s and spread stays mm/s. Initial/final O₂ values are endpoints, not segment concentrations.
- `data/provenance.json` records transcription method and verification status. Values were checked against NASA's indexed table text. Visual PDF verification and independent scientific review remain pending.
- [PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25), DOI 10.60555/4qc4-de67, is the related NASA dataset. This app uses report-transcribed observations, not a downloaded PSI raw archive. Raw video linkage and calibration reprocessing are not completed.
- One investigation and one report. Multiple rows or publications do not create independent corroboration. No safety certification, extrapolation to Moon/Mars, new predictive model, or raw-video measurement is implemented.

## API

- `GET /api/data`: records, provenance, AI availability; never credentials.
- `GET /api/search?question=...&material=PMMA&geometry=sheet&direction=opposed&thickness=1&oxygenMin=18&oxygenMax=22`: filtered records and rank reasons.
- `GET /api/compare?ids=M7,M8`: conditions and descriptive-comparison limitations.
- `POST /api/brief`: `{ "question": "Compare M7 and M8 airflow", "ids": ["M7", "M8"], "ai": false }`; grounded brief or abstention.

The server binds loopback only. It is a local prototype, not an authenticated public service. Before public deployment, add user authentication and per-user model quotas. No database, migration, or external service is necessary for offline operation.

## Repository map

| Path | Purpose |
|---|---|
| `server.mjs` | Loopback HTTP server, static files and the four API routes |
| `lib/evidence.mjs` | Ranking, filtering, comparison limitations, brief and abstention logic |
| `data/bass-table.csv` | The 20 transcribed Table 5.1 rows |
| `data/provenance.json` | Source, method, verification status and stated limitations |
| `data/evaluation.json` | 20 offline retrieval/abstention cases |
| `public/` | Single-page UI: `index.html`, `app.js`, `style.css` |
| `lib/scenario.mjs` | Will It Burn? question reader, evidence-match checks and answer builder behind `/api/ask` |
| `public/burn/` | Will It Burn? page: `index.html`, `app.js`, `style.css` |
| `test/scenario.test.mjs` | Question-reader, answer-rule and route tests for Will It Burn? |
| `docs/will-it-burn-*.md` | Concept and technical walkthroughs for Will It Burn? |
| `scripts/evaluate.mjs` | Offline evaluation runner |
| `test/` | `evidence.test.mjs` (data/API), `frontend.test.mjs` (UI state machine) |
| `docs/reviewer-protocol.md` | The human validation that is still outstanding |

## Validation status

13 automated tests cover transcription structure, two arithmetic reproductions, endpoint filtering, missing spread data, mismatched geometry/units, unsupported requests, source selection, HTTP validation, and the frontend rules on stale searches and out-of-order responses. Arithmetic reproduction checks M2's 0.019 mm/s and M8's 0.017 mm/s paired spread differences; these are not causal effect estimates or independent experimental validation.

The 20-question evaluation measures offline retrieval and abstention only (currently 20/20). It does not establish the proposed 18/20 live-AI accuracy target. Independent scientific review, three-person usability testing, and competitor time/correctness measurements remain human validation work. Use `docs/reviewer-protocol.md` rather than reporting these as passed.

## 90-second demo

Click the "Compare M7 & M8" example; press Select on both cards; press "Compare 2 tests" in the bottom tray; inspect the rows tagged "differs" (thickness, O₂); press "Write evidence brief" (it is written automatically); open a source; press "Export Markdown". Then go back and try "What is the safest material for Mars?" to show evidence abstention.
