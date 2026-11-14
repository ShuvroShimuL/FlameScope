# FlameScope · Team Polaris

> **NASA Space Apps Challenge 2026: [Flame in Freefall: AI-Powered Fire Safety Insights from Microgravity Combustion Data](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall-ai-powered-fire-safety-insights-from-microgravity-combustion-data/)**

**Fire-safety evidence for crewed habitats.** FlameScope summarises, ranks and interprets NASA microgravity
combustion experiments for the ISS, a lunar base, pressurized rovers and spacesuits, and it checks questions
about solid cabin materials against NASA's own test rows. It is guided by **VESTA** (Virtual Engineer for
Space-fire Threat Assessment), an AI crewmate built as a tool-using agent.

Every number shown comes from NASA data or a tested formula, every claim cites a file and row or page, and
nothing is presented as a safety rating. FlameScope is an independent student project and is not endorsed by NASA.

This is the unified application: the app formerly developed as **Project HEARTH** now carries the FlameScope
name, with the original FlameScope's "Will it burn?" evidence engine inside it. How the two were joined is in
[docs/integration/](docs/integration/).

_**Live Web Application:**_ _https://flame-scope.vercel.app/_

## What it does

| Page | What it does |
|---|---|
| **Mission overview** (`/`) | The active mission's oxygen, pressure and pO2; a map of every gas and droplet test as a 3D scene or flat chart; investigation ranking with its score parts; charts pinned from VESTA. |
| **Test explorer** (`/explorer`) | Filter, sort and page the ACME, CFI and SPICE tests; a details drawer with every field, the source row and related PDF passages. |
| **Compare** (`/compare`) | Two or three investigations side by side: coverage radar, mean conditions, shared and unique attributes. |
| **Safety & gaps** (`/safety`) | Six evidence-based rules with severity, confidence and sources; an oxygen × pressure gap heatmap; experiments that would fill each gap. |
| **Will it burn?** (`/burn`) | Ask about a solid material in a cabin. A test counts only if its own row recorded every condition you gave. The answer is **Burned**, **Mixed**, **No flame held**, **No data** or **Unclear**, with the matching NASA rows or the sourced gaps, ranked findings, NASA's quoted fire-response steps, saved questions and a Markdown evidence brief. |
| **My data lab** (`/lab`) | Your own conditions against the data; CSV upload kept in the browser; clearly labelled DEMO telemetry. |
| **Dataset** (`/dataset`) | How the gas and droplet data is built, every field and its fill rate, quality flags, downloads and NASA references. |
| **Flame simulator** (`/simulator`) | DEMO replays steered by real tests. The moving flame is artwork, not a combustion model. |
| **About** (`/about`) | Investigations, hardware, reference atmospheres, credits and limits. |
| **VESTA** (every page) | Streaming answers with live tool steps, charts, source chips, a confidence tag and an Engine room. |

## Two kinds of evidence, kept apart

| | Gas and droplet flames | Solid materials |
|---|---|---|
| Source | NASA PSI: ACME, CFI, SPICE | NASA BASS-II report NASA/TM-20210011385 (Tables 5.1, 7.1, A.2, 2.1) |
| Rows | 889 (847 after 42 flagged repeats) | 20 acrylic sheet tests, 23 SIBAL fabric tests, 3 Nomex tests |
| Where | `data/processed/tests.json` | `data/evidence/` |
| "Is it covered?" | at least 5 tests within ±5 points of O2 and ±2.5 psi | one row must record every condition given, with no tolerance |
| Scores | ranking, severity and hazard heuristics, labelled as heuristics | none |

They record oxygen, pressure and airflow in ways that cannot share a table, so they are never pooled
([ADR-017](docs/planning/decisions.md)). Also used, beside answers only: NASA's FLEX (PSI-69) and Saffire-II
(PSI-99) tables, and quoted passages from NASA OCHMO-TB-008 and Saffire papers.

## VESTA

Twelve tools: `query_data`, `search_docs`, `physics_calc`, `nearest_tests`, `envelope_check`, `compare`,
`rank_investigations`, `gap_finder`, `safety_audit`, `will_it_burn`, `make_chart`, `ui_action`.

| Engine | Used when |
|---|---|
| 1. Claude | `ANTHROPIC_API_KEY` is set |
| 2. ChatGPT | `OPENAI_API_KEY` is set |
| 3. FreeLLMAPI (local only) | `FREELLMAPI_API_KEY` is set and the desktop app runs on the same PC |
| 4. OpenRouter | `OPENROUTER_API_KEY` is set |
| 5. Groq | `GROQ_API_KEY` is set |
| 6. Gemini | `GEMINI_API_KEY` is set |
| 7. Offline mode | always: rules, the same tools, templated answers. No AI. |

**Auto** uses the first engine that works and falls through on a missing key, an auth or limit error, a server
error or a timeout; Offline mode answers if nothing else can. Every engine shares one prompt, one tool set and
one grounding check: a number in an answer must appear in a tool result or the user's message, or the answer is
flagged and its confidence lowered. For solid materials VESTA passes the evidence engine's answer on and adds
no number of its own. Keys never leave the server.

## Run it

Node 20 or newer.

```bash
npm ci
cp .env.example .env.local      # every key is optional
npm run dev                     # http://localhost:3000
```

| Check | Command | Expected |
|---|---|---|
| Types | `npx tsc --noEmit` | no errors |
| Lint | `npm run lint` | no warnings |
| Tests | `npm test` | all pass (see the [QA report](docs/integration/QA_REPORT.md) for the current count) |
| Evidence evaluation | `npm run evaluate` | 20/20 |
| Build | `npm run build` | succeeds; needs network access for the fonts |
| VESTA evals | start the server with `VESTA_EVAL_TOKEN=<16+ chars>`, then `npx tsx scripts/run-evals.ts --base http://localhost:3000 --engines offline` | `evals/report-offline.md` |

Stop any dev server before `npm run build`: both write to `.next`.

With no keys at all the app works fully in Offline mode.

**Read-only research tools (MCP):** `npm run mcp` exposes `will_it_burn`, `search_evidence`, `compare_tests`,
`evidence_brief` and `get_provenance` over stdio to any MCP client. It is registered in `.mcp.json`, reads
committed files only, and makes no network or model call.

**Data preparation** (only if the raw NASA files change): `scripts/ingest/ingest.py`, see
[docs/DATA_NOTES.md](docs/DATA_NOTES.md).

## Repository map

```text
app/                 pages and route handlers (Next.js 14 App Router)
components/          layout, charts, VESTA panel, and one folder per page
lib/                 data, physics, analysis, safety rules, search, missions, brand.ts (product identity)
lib/vesta/           agent loop, engine router, Offline mode, grounding, providers, tools
lib/burn.ts          typed front door to the solid-material evidence engine
lib/evidence/        that engine: rule-based reader, same-row matching, verdicts (plain JavaScript, no model, no network)
data/processed/      cleaned ACME, CFI and SPICE rows, PDF passages, source checksums
data/evidence/       transcribed BASS-II tables, NASA's FLEX and Saffire-II tables, fire-response quotes, provenance
Pseudo_DataKeep/     the raw NASA files, read-only
scripts/             ingest (Python), Blueprint generator, eval runner, MCP server, evidence evaluation
tests/               vitest suites; tests/evidence/ holds the engine's
evals/               VESTA eval questions and reports
docs/                API, data notes, planning and ADRs, the integration record, legacy docs of both projects
```

## Limits

- All tests ran in microgravity. Lunar and Martian gravity are untested, and nothing here bounds them.
- Solid evidence is three materials in the station's glovebox, at ordinary or lowered oxygen. Foams, wiring and every material at enriched oxygen are a gap.
- SPICE oxygen and pressure are documented conditions, not per-row measurements.
- Ranking, severity and the hazard index are FlameScope heuristics with published formulas, not NASA ratings.
- VESTA's AI engines write prose; their numbers are checked, their wording is not. Offline mode and the
  Will it burn? page involve no model.
- Several transcribed tables still await an independent check; each provenance record says which.

More in [docs/integration/QA_REPORT.md](docs/integration/QA_REPORT.md).

## Credits and licence

Built by **Team Polaris** for the NASA Space Apps Challenge 2026. Data: NASA Physical Sciences Informatics and
the NASA Technical Reports Server. Code: Apache-2.0, see [LICENSE](LICENSE) and [NOTICE](NOTICE); the status of
the code that came from the HEARTH repository is noted in
[docs/integration/REPOSITORY_AUDIT.md](docs/integration/REPOSITORY_AUDIT.md). AI assistance is disclosed in
[docs/AI_USE.md](docs/AI_USE.md). Agent rules: [AGENTS.md](AGENTS.md).
