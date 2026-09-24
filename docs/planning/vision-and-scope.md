# Vision and scope

**Challenge (2026):** NASA Space Apps Challenge 2026: *Flame in Freefall: AI-Powered Fire Safety Insights from Microgravity Combustion Data* ([challenge page](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall-ai-powered-fire-safety-insights-from-microgravity-combustion-data/)). The full statement is due 28 October 2026. Re-check this document against it on that day.

**Product focus:** **Will It Burn?** is the primary product (ADR-009). Its full feature list is in [features.md](features.md). The project has two views over one evidence core:

- **Will It Burn?** (`/`, the home page) is the front door. Ask about a cabin and get **Burned** (NASA saw it burn in tests whose own rows record every condition you gave), **Mixed** or **No flame held** (from the fabric and Nomex outcomes, never a safety rating), **No data** (with what is missing, the closest tests, and where that data may exist) or **Unclear** (part of the question couldn't be read, so nothing is answered).
- **FlameScope** (`/research/`) is the research view. Find tests, compare them, and export a source-linked brief.

## Vision

> Before anyone applies a fire test result, check that the test actually covered their conditions.

It is easy for a fire dashboard to quietly apply ISS results to Moon and Mars cabins, or to invent a "safety score." FlameScope does neither. Every number traces to one printed page of one NASA report. When the evidence runs out, it says so and names what is missing. The honest answer to a Moon-base fire question today is "no data," and that answer tells NASA which tests are still missing.

## Problem

| Who | Pain today | What FlameScope gives them |
|---|---|---|
| Spacecraft fire-safety engineers and mission designers | Microgravity combustion results are spread across NASA technical memos. Checking whether a test envelope covers a new cabin (gravity, O₂, pressure, airflow, thickness) is manual work. | A one-question check that a single test recorded all of their conditions, with row-level provenance |
| Researchers and students | Tables are in PDFs, units are mixed, and missing values are easy to misread as zero | Clean, unit-normalised records, where missing stays missing |
| Judges and the public | "Fire in space" is abstract | A plain-English verdict, an animated (clearly labelled) flame, and a one-tap source |

## Impact framing: Bangladesh

The score sheet asks for a Bangladesh framing with real numbers. Our angle is **the method, not the microgravity data**. Fire safety decisions in Bangladesh are often made on evidence that never covered the local conditions (building type, ventilation, material, occupancy). An "evidence envelope" check applies directly to that problem.

| Claim | Number | Source | Status |
|---|---|---|---|
| Tazreen Fashions factory fire, Nov 2012 | at least 112 deaths | Widely reported. Cite a primary source. | **verify before submission** |
| Bailey Road (Green Cozy Cottage) building fire, 29 Feb 2024 | 46 deaths | Widely reported. Cite a primary source. | **verify before submission** |
| Annual fire incidents nationwide | Needs to be filled in | Bangladesh Fire Service and Civil Defence (FSCD) annual statistics | **to source** |
| Active fire detections over Bangladesh | Needs to be filled in | NASA FIRMS (VIIRS/MODIS), see [roadmap](roadmap.md) R3 | **optional** |

Rule: no number goes on the project page or on camera until its row says **verified**, with a link. See [decisions.md](decisions.md) ADR-007.

## In scope (MVP, already built)

- 20 BASS-II PMMA sheet tests (NASA/TM-20210011385, Table 5.1, printed p. 57), transcribed with full provenance
- SIBAL fabric and Nomex outcomes from the same report (Tables 7.1 and A.2), each as its own evidence set (ADR-011)
- A question reader (rules, not an LLM) that covers missions and other places, cabin air, O₂, pressure, airflow, thickness, width and material, in common units. It says when it can't read a condition, and never swaps in a default for one you gave.
- A joint applicability check against each test's own row (ADR-012); a Burned / Mixed / No flame held / No data / Unclear verdict; gap cards with sources; the closest tests; and a nearest-evidence jump
- FlameScope search, a 2–3 test comparison and a Markdown evidence brief
- An optional constrained AI step that can only *select* evidence IDs or abstain
- An MCP server that exposes the same deterministic tools to any agent
- Offline-first operation: no remote assets, `OFFLINE=1`, and committed fixtures

## Out of scope (explicitly)

- Safety ratings, material certification, or "safest material" answers. The app refuses these.
- Extrapolating ISS results to partial gravity or new atmospheres. The app shows these as gaps.
- New predictive combustion models or raw-video measurement
- User accounts, public multi-tenant hosting and a database

## Success measures

| Measure | Target | Where it's measured |
|---|---|---|
| Every on-screen number traceable to a source row | 100% | `test/scenario.test.mjs`, the provenance drawer |
| Offline retrieval and abstention eval | 20/20 (current: 20/20) | `node scripts/evaluate.mjs` |
| Live-AI grounded answers or correct abstentions | ≥ 18/20, with zero unsupported safety claims | [reviewer-protocol.md](../reviewer-protocol.md), **not yet run** |
| Untrained user completes find → source → compare → limitation | ≥ 2 of 3 users within 5 minutes | reviewer-protocol, **not yet run** |
| Demo runs with wifi off | Yes | [offline-demo.md](offline-demo.md) rehearsal |
