# Will It Burn? · feature list

**Will It Burn?** (the home page, `/`) is the product we're focusing on (see [ADR-009](decisions.md)). This file lists every feature it has today. When you add, change or remove one, update its row here in the same commit.

**Status:** ✅ shipped · 🟡 partial · 🧪 idea / planned · ⛔ removed
**How to add a feature:** give it the next ID in its section (never reuse an ID), set a status, and name where it lives and how it's tested. Log the change at the bottom.

---

## 1. Asking a question

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| A-01 | Free-text question box | Type plain English, press Enter or **Ask**. Up to 500 characters. | ✅ | `web/index.html`, `app.js` | scenario routes |
| A-02 | Suggested questions | 6 one-tap questions, each showing a different outcome (full evidence, gravity + O₂ gap, air gap, thickness comparison, still air, untested material + safety word) | ✅ | `app.js` `QUESTIONS` | scenario tests |
| A-03 | Keyword chips | 12 chips (ISS, Moon base, Mars transit, Mars base, 34% oxygen, 8.2 psi, 1 mm, 5 mm, still air, 10 cm/s, acrylic, Nomex) that add words to the box without submitting | ✅ | `app.js` `KEYWORDS` | manual |
| A-04 | Rule-based question reader | Understands places, cabin air, O₂ %, pressure (psi/kPa/atm), airflow (cm/s, "still air", "fans off"), thickness ("1 mm", "thin", "thick") and 16 material families. No AI, and it works offline. | ✅ | `src/compute/scenario.mjs` `parseQuestion` | scenario tests |
| A-05 | "Read as" chips | Shows every field the app understood. Blue means from your question, dark means from a tap, dashed means a default. | ✅ | `app.js` `renderRead` | scenario tests |
| A-06 | Notices | Says when it made a call: two places mentioned, "thin" read as 1 mm, a safety word it can't certify, or nothing recognised | ✅ | `scenario.mjs` | scenario tests |
| A-07 | Canonical question | After any tap, the box is rewritten to match the screen, for example "Will a 1 mm acrylic sheet burn on the ISS in Earth-normal air?" | ✅ | `scenario.mjs`, `app.js` | scenario tests |
| A-08 | Input validation | Bad values (unknown mission, non-number thickness, a question that's too long) give a plain error, never a guess | ✅ | `scenario.mjs` `InputError` | scenario tests |

## 2. Choosing the cabin

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| C-01 | Mission tiles | ISS · Moon base · Mars transit · Mars base. Each sets the gravity and the default cabin air. | ✅ | `MISSIONS`, `renderTiles` | scenario tests |
| C-02 | Match badge per tile | Each tile shows how many NASA tests match that mission | ✅ | `ask()` → `missions[]` | scenario tests |
| C-03 | Cabin-air switch | Earth-normal (14.7 psi, 21% O₂) or Exploration (8.2 psi, 34% O₂, NASA/TP-2010-216134) | ✅ | `AIRS`, `#seg` | scenario tests |
| C-04 | Custom atmosphere | A typed O₂ % or pressure overrides the preset. It's labelled "Custom" unless it matches a preset. | ✅ | `resolveScenario` | scenario tests |
| C-05 | Oxygen partial pressure | Always computed in kPa and shown next to the O₂ share, so share and pressure aren't confused | ✅ | `scenario.mjs` | scenario tests |
| C-06 | Tap beats question beats default | Explicit taps override the question, and the question overrides defaults | ✅ | `resolveScenario` | scenario tests |

## 3. The answer

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| V-01 | Verdict stamp | **Burned** (NASA saw it burn under matching conditions) or **No data** (no test matches) | ✅ | `renderVerdict` | scenario tests |
| V-02 | Plain headline and subline | For example "Yes. NASA watched it burn." / "Unknown. None of these tests felt lunar gravity." Includes the burn-time range. | ✅ | `ask()` | scenario tests |
| V-03 | Evidence match table | Your cabin next to what the tests covered: material, gravity, O₂, pressure, plus airflow and thickness when you gave them | ✅ | `checksFor`, `#match` | scenario tests |
| V-04 | Envelope derived from data | The tested ranges (O₂ 16.8–22.2%, airflow 2–21 cm/s, 1–5 mm) are computed from the 20 rows, never typed in | ✅ | `ENVELOPE` | scenario tests |
| V-05 | "Why it matters" line | A sourced sentence from the BASS-II rod study when there is evidence | ✅ | `ask()` | scenario tests |
| V-06 | Chamber view | An animated flame: a blue sphere in microgravity, a dashed outline with "?" at Moon or Mars gravity, labelled **Illustration**, with gravity and air readouts | ✅ | `app.js` canvas | manual |

## 4. Evidence (step 2)

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| E-01 | Thickness chips | Tap a thickness to refine, or show all of them | ✅ | `renderPanel2` | manual |
| E-02 | Spread chart | SVG chart of flame spread vs airflow for every tracked test. Tests in the answer are coloured by thickness and the rest are grey. A dashed line marks your airflow. | ✅ | `renderChart` | manual |
| E-03 | Tappable chart dots | Hover or focus shows the values. Click or Enter opens that test's row. | ✅ | `renderChart` | manual |
| E-04 | Four readouts | Tests matched, burn-time range, fastest and slowest spread (with test ID). Each one opens its rows. | ✅ | `renderPanel2` | scenario tests (values) |
| E-05 | One plain finding | For example "1 mm sheets spread about 3× faster than 5 mm", labelled descriptive, not a safety rating | ✅ | `ask()` `finding` | scenario tests |
| E-06 | Missing stays missing | Tests without a tracked spread (M6, M12) are counted as "not tracked", never plotted as 0 | ✅ | `evidence.mjs` | evidence tests |

## 5. Gaps (step 2 when the answer is No data)

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| G-01 | Gap cards | One or two cards per failing check (gravity, oxygen and pressure, airflow, thickness, material), each with a source link | ✅ | `ask()` `gaps[]` | scenario tests |
| G-02 | "Where the data may exist" | Cards name Saffire V/VI, SoFIE and partial-gravity studies | ✅ | `SOURCES` | scenario tests |
| G-03 | Nearest-evidence jump | One button changes the fewest settings needed to reach a **Burned** answer, and says what it changed | ✅ | `ask()` `nearest` | scenario tests (always reaches Burned) |
| G-04 | Nitrogen insight | When the O₂ partial pressure is inside the tested range but the cabin is Exploration air, it explains that the cabin has less than half the nitrogen | ✅ | `ask()` | scenario tests |

## 6. Proof (step 3)

| ID | Feature | What the user sees or does | Status | Lives in | Tested |
|---|---|---|---|---|---|
| P-01 | Source rows dialog | Opens the exact NASA table rows behind the answer, with the report, page, PSI-25 DOI and an NTRS link | ✅ | `openProof` | manual |
| P-02 | Source list for gaps | For a No-data answer, the proof shows the cited sources instead of rows | ✅ | `openProof('gap')` | manual |
| P-03 | Every number opens its source | Readouts, chart dots and cards all open the rows they came from | ✅ | `app.js` | manual |
| P-04 | Footer citations | All sources are listed, plus the "transcribed by our team; independent check pending" disclosure | ✅ | `index.html` | n/a |
| P-05 | Provenance drawer with method, verification status and limitations, reachable from any screen | | 🧪 | [roadmap](roadmap.md) R2 | none |
| P-06 | `live`/`cache`/`fixture` badge on fetched values | | 🧪 | R1 | none |

## 7. Quality, access and trust

| ID | Feature | Status | Notes |
|---|---|---|---|
| Q-01 | Works fully offline: no remote fonts, scripts or libraries, and `OFFLINE=1` | ✅ | CSP `default-src 'self'` |
| Q-02 | Stale-reply guard: fast tapping can never show an older answer | ✅ | request `version` counter |
| Q-03 | Light and dark themes, with a colour-blind-safe chart ramp | ✅ | `prefers-color-scheme` |
| Q-04 | Respects reduced motion. The flame pauses when off screen. | ✅ | `matchMedia`, `IntersectionObserver` |
| Q-05 | Keyboard and screen reader: labelled controls, `aria-live` results, focusable chart dots | ✅ | |
| Q-06 | Responsive down to phone width | ✅ | breakpoints at 900, 760 and 440 px |
| Q-07 | Never says "safe". A safety word triggers a "can't certify" notice. | ✅ | scenario tests |
| Q-08 | All server text is escaped before rendering | ✅ | `esc()` |

## 8. For agents and developers

| ID | Feature | Status | Notes |
|---|---|---|---|
| D-01 | `GET /api/ask` JSON API (q, mission, air, o2, psi, material, thickness, airflow) | ✅ | [technical doc §8](../will-it-burn-technical.md) |
| D-02 | MCP tool `will_it_burn`, so any agent can ask the same question | ✅ | [mcp-server.md](mcp-server.md) |

---

## Ideas backlog (not built yet)

Move a row into a section above, with a new ID, once it ships.

| Idea | Why | Size |
|---|---|---|
| Shareable URL state (`/?mission=moon&air=exploration`) | Link a judge straight to the "No data" moment | S |
| Provenance drawer (P-05) and source badges (P-06) | Validity score | S |
| Bangladesh impact panel (verified numbers, NASA FIRMS) | Impact score | M |
| Second evidence set (Saffire V/VI or SoFIE) so 34% O₂ cabins get real answers | Relevance, and fewer "No data" answers | L |
| Material comparison once a second material exists | The challenge asks to "rank" | M |
| Bangla language toggle | Local audience | M |
| Static export of pre-computed answers for hosting | Repo access, offline safety net step 4 | M |

## Change log

| Date | Change | By |
|---|---|---|
| 2026-09-23 | First inventory: 44 shipped features, 2 planned | Claude Code, for review by the team |
| 2026-09-23 | Will It Burn? is now the home page (`/`). Old `/burn/` links redirect, and FlameScope moved to `/research/`. Backlog item removed. | Claude Code |
