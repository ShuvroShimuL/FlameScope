# Will It Burn? · feature list

**Will It Burn?** (the home page, `/`) is the product we're focusing on (see [ADR-009](decisions.md)). This file lists every feature it has today. When you add, change or remove one, update its row here in the same commit.

**Status:** ✅ shipped · 🟡 partial · 🧪 idea / planned · ⛔ removed
**How to add a feature:** give it the next ID in its section (never reuse an ID), set a status, and name where it lives and how it's tested. Log the change at the bottom.

---

## 1. Asking a question

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| A-01 | Free-text question box | Type plain English, press Enter or **Ask**. Up to 500 characters. | ✅ | `web/index.html`, `app.js` | scenario routes |
| A-02 | Suggested questions | 6 one-tap questions, each showing a different outcome (full evidence, gravity + O₂ gap, air gap, thickness comparison, still air, and a safety word about Nomex on Mars: NASA tested Nomex in orbit, but never at Martian gravity) | ✅ | `app.js` `QUESTIONS` | scenario tests |
| A-03 | Keyword chips | 12 chips (ISS, Moon base, Mars transit, Mars base, 34% oxygen, 8.2 psi, 1 mm, 5 mm, still air, 10 cm/s, acrylic, Nomex) in a list that opens under the Ask field while it has focus, like Spotlight. A tap adds the word without submitting, and Escape closes the list. | ✅ | `app.js` `KEYWORDS`, `.ask-pop` | manual |
| A-04 | Rule-based question reader | Understands places (the four missions, Earth, other worlds, a gravity in g), cabin air, O₂ %, pressure (psi, kPa, atm, bar, mmHg), airflow (mm/s, cm/s, m/s, ft/s, km/h, mph, "still air"), thickness and width (mm, cm, µm, inch, "thin", "thick") and materials, with or without a hyphen ("0.5-inch"). Gravity can be a fraction ("1/6 g") or words ("partial gravity"). A velocity is never read as a thickness. Every rule masks what it reads, so no number is read twice. A material or place outside the data stays what was asked ("steel", "Earth", "partial gravity") and answers No data, never acrylic or the ISS. No AI, and it works offline. | ✅ | `src/compute/question.mjs` `parseQuestion` | `test/question.test.mjs` |
| A-05 | "Read as" chips | Shows every field the app understood. Blue means from your question, a solid outline means from a tap, dashed means a default, and red means it couldn't be read. | ✅ | `app.js` `renderRead` | `test/question.test.mjs` |
| A-06 | Notices | Says when it made a call: two places mentioned, "thin" read as 1 mm, a bare 34% read as oxygen, a comparison like "3 times faster" that isn't a condition, a material it didn't show, a safety word it can't certify, or nothing recognised | ✅ | `question.mjs` | `test/question.test.mjs` |
| A-07 | Canonical question | After any tap, the box is rewritten to match the screen, for example "Will a 1 mm acrylic sheet burn on the ISS in Earth-normal air?". An unclear question is never rewritten into one the app made up. | ✅ | `scenario.mjs`, `app.js` | scenario and question tests |
| A-08 | Input validation | Bad tapped values (unknown mission, non-number or out-of-range values, booleans where numbers go, a question that's too long) give a plain error, never a guess | ✅ | `scenario.mjs` `InputError` | scenario and question tests |
| A-09 | Unclear conditions | A malformed, contradictory or unit-less condition ("150% oxygen", "21% and 34% oxygen", "airflow of 5", "a flow of 0.3 cm") answers **Unclear** with the reason, and no evidence. So does any number the reader can't place ("a 0.5 in sheet", "at 7"): no number is silently dropped. Years and mission numbers ("2030", "Artemis 3") are names, not conditions. A tap after Unclear sends the question again, so it answers only if it replaces the part that couldn't be read, and the hint names those taps. A condition no table records (temperature, sample length, humidity) is named and blocks an affirmative answer. (ADR-012) | ✅ | `question.mjs`, `scenario.mjs`, `state.js` | `test/question.test.mjs`, `test/frontend-home.test.mjs` |

## 2. Choosing the cabin

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| C-01 | Mission tiles | A row of four cards above the answer: ISS, Moon base, Mars transit and Mars base. Each sets the gravity and the default cabin air. | ✅ | `MISSIONS`, `renderTiles` | scenario tests |
| C-02 | Match badge per tile | Each tile shows how many NASA tests match that mission | ✅ | `ask()` → `missions[]` | scenario tests |
| C-03 | Cabin-air switch | Earth-normal (14.7 psi, 21% O₂) or Exploration (8.2 psi, 34% O₂, from NASA's 2015 evidence report, NTRS 20150021491) | ✅ | `AIRS`, `#seg` | scenario tests |
| C-04 | Custom atmosphere | A typed O₂ % or pressure overrides the preset. It's labelled "Custom" unless it matches a preset. | ✅ | `resolveScenario` | scenario tests |
| C-05 | Oxygen partial pressure | Always computed in kPa and shown next to the O₂ share, so share and pressure aren't confused | ✅ | `scenario.mjs` | scenario tests |
| C-06 | Tap beats question beats default | Explicit taps override the question, and the question overrides defaults | ✅ | `resolveScenario` | scenario tests |
| C-07 | Material picker | In the Cabin card: Acrylic sheet (20 tests), SIBAL fabric (23) or Nomex (3), with a checkmark on the current one. A tap asks again with that material and all thicknesses. Other materials are still reached by asking, and answer No data. | ✅ | `index.html` `#materials`, `app.js` | `test/sets.test.mjs` (the answers); manual (the picker) |

## 3. The answer

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| V-01 | Verdict stamp | **Burned**, **Mixed**, **No flame held**, **No data** or **Unclear**, as a large coloured word with the matching-test count under it. Burned and Mixed are orange, No flame held is grey, No data is amber and Unclear is grey. None of them is ever green. Before an answer arrives the stamp reads "Loading…", and a failed request shows "Not answered", never an old verdict. | ✅ | `renderVerdict`, `showVerdictState` | scenario and frontend tests |
| V-02 | Plain headline and subline | For example "Yes. NASA watched it burn." / "Unknown. None of these tests felt lunar gravity." Includes the burn-time range. A safety question never gets an opening that reads as yes or no. The question being answered is shown above the headline. | ✅ | `ask()`, `#answering` | `test/question.test.mjs` |
| V-03 | Evidence match list | In its own card: your cabin next to what the tests recorded, for material, gravity, O₂ and pressure, plus airflow, thickness and width when you gave them. Each row is marked Match, Station air (the tests' own air), Not recorded (pressure is never measured), In other tests, or Gap. A "Together" row appears when each condition was recorded but never in one test. | ✅ | `applicability.mjs`, `#match` | `test/applicability.test.mjs` |
| V-04 | Joint applicability (ADR-012) | A test counts only if its own row records every condition you gave, together: a set airflow value, an oxygen inside its start-to-end span, a fabric flow ramp passed through, a thickness or width. Nothing is interpolated, and the set's overall ranges are context, never a match. Acrylic oxygen is never tied to one airflow reading. | ✅ | `src/compute/applicability.mjs` | `test/applicability.test.mjs` |
| V-08 | Closest tests | When no test records all your conditions, up to five tests that record some of them are listed with each recorded value, a ✓ or ✕ per condition, and their source row. They are never counted as a match. | ✅ | `ask()` `closest`, `closestHtml` | `test/applicability.test.mjs` |
| V-05 | "Why it matters" line | A sourced sentence from the BASS-II rod study when there is evidence | ✅ | `ask()` | scenario tests |
| V-07 | Mixed and "No flame held" verdicts | Fabric and Nomex answers come from test outcomes. **Mixed**, for example "20 of 23 tests burned", says where the others didn't ignite and how many went out as the airflow changed. **No flame held**, for example Nomex "0 of 3 tests", always opens with "That isn’t a safety rating". The chamber shows the Nomex sample unlit. (ADR-011) | ✅ | `outcomeVerdict` in `scenario.mjs`, `renderVerdict` | `test/sets.test.mjs` |
| V-06 | Chamber view | An animated flame beside the verdict, labelled **Illustration**, with gravity and air readouts and a caption under it. Only matched evidence in microgravity draws a lit blue sphere. No data, Unclear and not-answered states draw a dashed outline with "?", even in orbit, and No flame held draws the sample unlit. | ✅ | `app.js` canvas, `state.js` `verdictView` | `test/frontend-home.test.mjs` |

## 4. Evidence

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| E-01 | Thickness chips | Tap a thickness to refine, or show all of them | ✅ | `renderPanel2` | manual |
| E-02 | Spread chart | SVG chart of flame spread vs airflow for every tracked test. Tests in the answer are coloured by thickness and the rest are grey. A dashed line marks your airflow. | ✅ | `renderChart` | manual |
| E-03 | Tappable chart dots | Hover or focus shows the values. Click or Enter opens that test's row. | ✅ | `renderChart` | manual |
| E-04 | Key numbers | Four cards under the verdict: matching tests, burn-time range, and the fastest and slowest spread among the matching readings, with their test IDs ("Not tracked" when none was tracked). For fabric and Nomex they show the test count and an outcome bar (burned, went out, blew out, didn't ignite) whose parts add up to every matching test; at a given airflow the bar describes that airflow. Each card opens its rows. Hidden when there's no answer. | ✅ | `renderKpis` | scenario and applicability tests (values) |
| E-05 | One plain finding | For example "1 mm sheets spread about 3× faster than 5 mm", labelled descriptive, not a safety rating | ✅ | `ask()` `finding` | scenario tests |
| E-06 | Missing stays missing | Tests without a tracked spread (M6, M12) are counted as "not tracked", never plotted as 0 | ✅ | `evidence.mjs` | evidence tests |
| E-08 | Fabric and Nomex evidence | The evidence card lists every test from the report's Table 7.1 (SIBAL cotton-fibreglass fabric, 23 used tests) or Table A.2 (Nomex III, 3 tests), with the airflow, the O₂ and what happened, in the report's own words. The outcome bar in the key numbers counts the tests that burned, went out or didn't ignite. Proof opens the same rows. | ✅ | `data/bass-fabric.csv`, `data/bass-nomex.csv`, `sets.mjs`, `renderOutcomes` | `test/sets.test.mjs` |
| E-09 | Also seen in Saffire-II | Beside acrylic, SIBAL and Nomex answers, one line reports what Saffire-II (PSI-99) saw. It's a separate, larger experiment, so it never changes the verdict. Examples: "the Nomex was not ignited"; SIBAL spread at 2.1 and 2.6 mm/s; thick acrylic flames "remain anchored at the base". A silicone question stays No data, but its card reports that none of 4 samples spread in orbit, while 3 of 4 burned on the ground. | ✅ | `data/psi-99-saffire-2.csv`, `saffire.mjs`, `relatedHtml` | `test/saffire.test.mjs` |
| E-07 | Ranked findings | Five descriptive findings across all 20 tests, ranked by how consistently pairs of readings agree: Consistent, Suggestive, Mixed or Too few pairs (the app's display rule, not a statistical test). Each says what is matched and what isn't (between-test pairs don't match oxygen), shows its pair count beside its distinct-test count ("29 of 30 reading pairs agree, from 13 tests") with one dot per pair, and says that pairs reuse readings ("M7 is in 6 of them"). It also shows a caveat computed from the rows (for example "the one exception, M3, is also the only test listed from low to high flow") and a button that opens its rows. Labelled "descriptive, not causal, and not a safety ranking". It has its own section, and the Overview shows all five in a card. They describe the acrylic tests as a whole, so `/api/data` serves them for every answer. | ✅ | `src/compute/findings.mjs`, `/api/data` `findings`, `app.js` `renderFindings` | `test/findings.test.mjs` |

## 5. Gaps (when the answer is No data)

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| G-01 | Gap cards | One or two cards per failing check (gravity, oxygen and pressure, airflow, thickness, width, material, unrecorded conditions), each with a source link. An airflow between two set values names the nearest settings and their tests. A combination recorded only in separate tests lists which tests recorded each condition. | ✅ | `ask()` `gaps[]` | scenario and applicability tests |
| G-02 | "Where the data may exist" | Cards name Saffire V/VI (about 10 psi and 26% O₂, and about 8 psi and 29–31% O₂), SoFIE, LUCI (the first lunar-gravity burns longer than 25 s) and the partial-gravity rod study | ✅ | `SOURCES` | scenario tests |
| G-03 | Nearest-evidence jump | One button fixes set-level gaps first, then drops the fewest conditions needed to reach matching tests, and says what it changed. It is hidden for an Unclear answer. | ✅ | `ask()` `nearest` | `test/applicability.test.mjs` (lands on matching tests for each kind of gap tested) |
| G-05 | Still-air evidence | A still-air acrylic question adds Table 2.1: thin-acrylic flames went out below 1 ± 0.5 cm/s of opposing airflow at 21% O₂. Fabric shows its 6 tests that went out as the airflow dropped. Cotton points to SIBAL as the nearest evidence, and says SIBAL isn't pure cotton. | ✅ | `gapsFor`, `data/bass-extinction.csv` | `test/sets.test.mjs` |
| G-04 | Nitrogen insight | When the O₂ partial pressure is inside the tested range but the cabin is Exploration air, it explains that the cabin has less than half the nitrogen | ✅ | `ask()` | scenario tests |

## 6. Proof

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| P-01 | Source rows sheet | Opens the exact NASA table rows behind the answer, with the report, page, PSI-25 DOI and an NTRS link. On phones it opens as a bottom sheet. | ✅ | `openProof` | manual |
| P-02 | Source list for gaps | For a No-data answer, the proof shows the cited sources instead of rows | ✅ | `openProof('gap')` | manual |
| P-03 | Every number opens its source | Key numbers, chart dots, finding rows and cards all open the rows they came from | ✅ | `app.js` | manual |
| P-04 | Sources section | Lists every source and says how an answer is made: fixed rules, no AI writing, and MCP for agents. It also has the transcription note: the O₂ values match NASA's own PSI-25 table, and the other columns still await an independent check. A footer on every section names the Space Apps challenge. | ✅ | `index.html` `#panel-sources`, `.main-foot` | `test/psi.test.mjs` (the O₂ match) |
| P-05 | Provenance drawer with method, verification status and limitations, reachable from any screen | | 🧪 | [roadmap](roadmap.md) R2 | none |
| P-06 | `live`/`cache`/`fixture` badge on values fetched at run time. The home page's evidence is committed data, so it would carry a "committed" label, never "live". | | 🧪 | R1 | none |

## 7. Quality, access and trust

| ID | Feature | Status | Notes |
|---|---|---|---|
| Q-01 | Works fully offline: no remote fonts, scripts or libraries, and `OFFLINE=1` | ✅ | CSP `default-src 'self'` |
| Q-02 | Stale-reply guard and newest intent: fast tapping can never show an older answer, each tap builds on the newest intended scenario (Moon, then Nomex, keeps the Moon), and a tap made while a typed question is being read applies to that question | ✅ | `web/state.js` `createController`; `test/frontend-home.test.mjs` |
| Q-03 | Light and dark themes in Apple's system colours and system fonts, with a colour-blind-safe chart ramp | ✅ | `prefers-color-scheme` |
| Q-04 | Respects reduced motion. The flame pauses when off screen. | ✅ | `matchMedia`, `IntersectionObserver` |
| Q-05 | Keyboard and screen reader: labelled controls, `aria-live` results, focusable chart dots. Section links carry `aria-current`, and each section's heading takes focus when you switch. | ✅ | |
| Q-06 | Responsive down to phone width. On phones the sidebar becomes a bottom tab bar. | ✅ | breakpoints at 1180, 980, 820 and 420 px |
| Q-07 | Never says "safe". A safety word triggers a "can't certify" notice. | ✅ | scenario tests |
| Q-08 | All server text is escaped before rendering | ✅ | `esc()` |

## 8. For agents and developers

| ID | Feature | Status | Notes |
|---|---|---|---|
| D-01 | `GET /api/ask` JSON API (q, mission, air, o2, psi, material, thickness, airflow) | ✅ | [technical doc §8](../will-it-burn-technical.md) |
| D-02 | MCP tool `will_it_burn`, so any agent can ask the same question | ✅ | [mcp-server.md](mcp-server.md) |

## 9. NASA's fire response

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| F-01 | NASA's fire response, quoted | NASA's eight ISS fire-response steps from OCHMO-TB-008 Rev A (29 Nov 2023), word for word and in NASA's order, with the source and date. Each step shows what microgravity tests say about it, each line with its source, and an evidence status: One test, Some evidence, Mixed evidence, Supports why, Related test only or No data found. Two lines are computed from NASA tables: the BASS-II airflow finding, and FLEX's CO₂ and helium test counts (PSI-69). Detection also cites SAME's smoke measurements (PSI-102). A "Sources differ" note appears where a 2020 NASA paper describes a step differently. The section looks the same for every answer, so a verdict never becomes a danger level (ADR-010). The Overview shows the same eight steps in a card, one line each with its status, in NASA's order. | ✅ | `data/fire-response.json`, `data/psi-69-flex.csv`, `src/compute/response.mjs`, `src/compute/flex.mjs`, `app.js` `renderFireResponse` | `test/response.test.mjs`, `test/flex.test.mjs` |

## 10. Dashboard layout

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| L-01 | App window | A toolbar with the Ask field, and a sidebar with four sections: Overview, Ranked findings, Fire response and Sources. Each section has its own address (`#findings`), so links and the Back button work. On phones the sidebar becomes a bottom tab bar. | ✅ | `index.html`, `app.js` `showTab`, `style.css` | manual |
| L-02 | Overview cards | Suggestions, mission tiles and "Read as", then the verdict beside the chamber, the key numbers, the evidence card, the Cabin and Evidence match cards, and cards for the ranked findings and the fire response. Each card links to its section. | ✅ | `index.html`, `app.js` | manual |

---

## Ideas backlog (not built yet)

Move a row into a section above, with a new ID, once it ships.

| Idea | Why | Size |
|---|---|---|
| Shareable URL state (`/?mission=moon&air=exploration`) | Link a judge straight to the "No data" moment | S |
| Provenance drawer (P-05) and source badges (P-06) | Validity score | S |
| Bangladesh impact panel (verified numbers, NASA FIRMS) | Impact score | M |
| Second evidence set: more BASS-II tables first, then Saffire IV–VI ([datasets.md](datasets.md) §5). Saffire VI reached about 8 psi and 29–31% O₂, so a 34% cabin stays a gap. | Relevance, and fewer "No data" answers | L |
| Rank materials once a second material exists | Extends the ranked findings (E-07) | M |
| Bangla language toggle | Local audience | M |
| Static export of pre-computed answers for hosting | Repo access, offline safety net step 4 | M |

## Change log

| Date | Change | By |
|---|---|---|
| 2026-09-23 | First inventory: 44 shipped features, 2 planned | Claude Code, for review by the team |
| 2026-09-23 | Will It Burn? is now the home page (`/`). Old `/burn/` links redirect, and FlameScope moved to `/research/`. Backlog item removed. | Claude Code |
| 2026-09-24 | Fixed five cited claims found in the dataset review ([datasets.md](datasets.md) §4): the Saffire V/VI conditions, the exploration-atmosphere source, the rod oxygen limit, the lunar "worst case" wording and the partial-gravity card, which now cites LUCI. Updated C-03, G-02 and the footer. | Claude Code |
| 2026-09-24 | Added E-07, ranked findings | Claude Code |
| 2026-09-24 | Added F-01: NASA's fire response, quoted, with the evidence for each step (ADR-010) | Claude Code |
| 2026-09-24 | The proof note and footer now say the O₂ values match NASA's PSI-25 table, which `test/psi.test.mjs` checks. Updated P-04. | Claude Code |
| 2026-09-24 | Added E-09: Saffire-II (PSI-99) results shown beside answers, never inside them. The match header now reads "NASA’s tests". | Claude Code |
| 2026-09-24 | Transcribed the rest of the BASS-II report's tables (7.1 fabric, A.2 Nomex, 2.1 extinction). Added V-07, E-08 and G-05. SIBAL fabric and Nomex are now tested materials. The Nomex suggestion now shows a gravity gap, and nearest evidence can land on Mixed or No flame held (ADR-011). | Claude Code |
| 2026-09-24 | F-01 gained two evidence lines: FLEX's CO₂ and helium suppressant tests (computed from NASA's PSI-69 table) under step 5, and SAME's smoke measurements (PSI-102) under step 1, which now reads "Some evidence" | Claude Code |
| 2026-09-24 | Apple-style dashboard redesign. Added L-01 (app window with sidebar, tab bar and section addresses), L-02 (Overview cards) and C-07 (material picker). E-04 is now the key-number cards, with an outcome bar for fabric and Nomex. E-07 has its own section and an Overview card, is served by `/api/data` for every answer, and shows one dot per comparison. P-04 is now the Sources section. A-03's words open under the Ask field. Updated A-05, C-01, V-01, V-03, V-06, E-08, P-01, P-03, Q-03, Q-05, Q-06 and F-01. The No data subline no longer mentions "Step 2". | Claude Code |
| 2026-09-24 | Audit fixes. Answers now use joint applicability (ADR-012): a test counts only if its own row records every condition given, so 1 mm at 16.8% O₂ and 21 cm/s, and SIBAL at 21% O₂ and 53 cm/s, now answer No data with the closest tests instead of Burned. The reader no longer swaps an explicit condition for a default (steel, Earth, 0% O₂, 100 psi, 1 m/s, 20 mm/s), and a safety question never gets a yes or no. Added A-09 (Unclear), V-04 (replaces "envelope derived from data") and V-08 (closest tests). E-07 now says what isn't matched and counts distinct tests. The page keeps the newest intended scenario, opens and fails in neutral states, and lights the flame only for matched evidence. After an independent review, any number the reader can't place answers Unclear, and a tap after Unclear sends the question again, so a value read from an unclear question can never reach an answer. Updated A-04 to A-08, V-01 to V-03, V-06, E-04, G-01, G-03, P-06 and Q-02. | Claude Code |
