# Sources for the concept video slides

Every number in `slides.pptx` is listed here, with the exact wording the slide uses and the source printed under it. A number that isn't in this file doesn't go on a slide.

The first table comes from "Source for every number on screen" in the concept video script (draft 2, 28 Sep 2026). Each row was checked against the app's data and code on 28 Sep 2026, and the last column says where. The journal and NASA documents themselves were last read on 24 Sep 2026 ([datasets.md](../planning/datasets.md) §4), not again for this deck.

## 1. Numbers in the slide text

| ID | On the slide, word for word | Slide | Source line on the slide | Checked against |
|---|---|---|---|---|
| S1 | 20 of 20 acrylic sheets burned, for 6 to 31 minutes each | 8 | NASA/TM-20210011385 (BASS-II), Table 5.1, printed p. 57 | `data/bass-table.csv` (20 rows, `burn_min`), and the verdict from `ask()` in `src/compute/scenario.mjs` |
| S2 | The tests recorded 16.8–22.2% oxygen. | 9 | NASA/TM-20210011385 (BASS-II), Table 5.1, printed p. 57 | `ENVELOPE.o2Min` and `o2Max` in `src/compute/applicability.mjs` |
| S3 | 17% O₂ | 4 | Scientific Reports (2018), “The Effect of Gravity on Flame Spread over PMMA Cylinders” | The `why` line in `scenario.mjs`, and the paper's sentence quoted in `datasets.md` §4 |
| S4 | 18% O₂ | 4 | Scientific Reports (2018), “The Effect of Gravity on Flame Spread over PMMA Cylinders” | Same as S3 |
| S5 | 34% O₂ at 8.2 psi | 5 | NASA evidence report (2015), NTRS 20150021491 | `AIRS.exploration` in `src/compute/catalog.mjs` |
| S6 | 1/6 g | 5 | 1/6 g (0.17 g): standard value, as used in the app | The Moon base entry of `MISSIONS` in `catalog.mjs` |
| S7 | of Earth’s gravity (0.17 g) | 5 | 1/6 g (0.17 g): standard value, as used in the app | Same as S6 |
| S8 | With faster airflow, flames spread faster in 29 of 30 reading pairs | 11 | the app’s ranked finding #1, computed from NASA/TM-20210011385, Table 5.1. The pairs reuse readings. | `rankFindings()` in `src/compute/findings.mjs` |
| S9 | NASA’s 8 fire-response steps for the Station, next to the test evidence | 12 | NASA OCHMO-TB-008 Rev A (29 Nov 2023) | `data/fire-response.json` (8 steps) |
| S10 | Saffire V and VI | 18 | Saffire V and VI, NASA ICES-2024-365, Table 1 | `SOURCES.saffire` in `catalog.mjs` |
| S11 | LUCI | 18 | LUCI, NASA (2025), NTRS 20250010653 | `SOURCES.luci` in `catalog.mjs` |

Notes:

- **S1, rounding.** The rows of Table 5.1 record burn times from 6.4 to 30.7 minutes. The app rounds to whole minutes, and the slide uses the app's words.
- **S2.** The narration says "about 22%". The slide shows the recorded range: 16.8% is the lowest final reading and 22.2% is the highest starting one.
- **S3 and S4.** The narration says "the same rods". The slide says "rods of the same sizes", as the app does, because the ground tests used other rods of the same sizes.
- **S8.** The narration says "paired readings". The slide says "reading pairs", as the app does. The count is descriptive, not causal: the pairs reuse readings.
- **S11.** LUCI is named on the script's card 8 but has no row in the script's table. This row comes from the app's own citation.

## 2. Names that contain a number

These aren't measurements. They are listed so that every numeral on a slide can be found in this file.

| On the slide | Slide | What it is |
|---|---|---|
| NASA Space Apps 2026 | 6, 20 | The event's name |
| Flame in Freefall: AI-Powered Fire Safety Insights from Microgravity Combustion Data | 6 | The challenge's title, word for word |

## 3. Numbers inside the prototype captures

Slides 8 to 12, 17 and 18 show captures of the prototype. They were taken on 28 Sep 2026 from commit `acc9144`, running with `OFFLINE=1` in the dark theme, and are saved in `screens/`. The app computed every number in them from the tables below. Nothing in a capture was retouched.

| Capture | Slide | Number in the capture | Source |
|---|---|---|---|
| `verdict-burned.png` | 8 | 20 of 20 tests; all 20 acrylic sheets; 6 to 31 minutes | NASA/TM-20210011385 (BASS-II), Table 5.1, printed p. 57 |
| | | 17% O₂ in orbit; 18% or below on the ground | Scientific Reports (2018), “The Effect of Gravity on Flame Spread over PMMA Cylinders” |
| | | 21% O₂ at 14.7 psi; Earth, 1 g | Standard values, as used in the app (`AIRS.earth`) |
| | | O₂ pressure 21.3 kPa | Computed by the app: 14.7 psi × 6.894757 kPa per psi × 21% |
| `verdict-no-data.png` | 9 | 0 of 20 tests match | NASA/TM-20210011385 (BASS-II), Table 5.1: no row records these conditions |
| | | 0.17 g; 1/6 g; 1/6 of Earth’s gravity | Standard value, as used in the app |
| | | 34% O₂ at 8.2 psi | NASA evidence report (2015), NTRS 20150021491 |
| | | O₂ pressure 19.2 kPa | Computed by the app: 8.2 psi × 6.894757 kPa per psi × 34% |
| `key-numbers.png` | 10 | 20 tests; 2 with spread not tracked (M6, M12) | NASA/TM-20210011385 (BASS-II), Table 5.1 |
| | | 6–31 min | Same table, rounded as in S1 |
| | | 0.144 mm/s: M16, 1 mm sheet, 5 cm/s air | Same table, row M16 |
| | | 0.012 mm/s: M20, 5 mm sheet, 10 cm/s air | Same table, row M20 |
| `ranked-findings.png` | 11 | All 20 acrylic tests; ranks 1 to 5 | The app’s ranking, computed from Table 5.1 by `src/compute/findings.mjs` |
| | | 29 of 30 reading pairs, from 13 tests | Same |
| | | 23 of 26 reading pairs, from 16 tests | Same |
| | | 3 of 4 reading pairs, from 6 tests | Same |
| | | 2 of 2 reading pairs, from 4 tests | Same |
| | | 0 of 1 reading pair, from 2 tests | Same |
| `fire-response.png` | 12 | Steps 1 to 8 | NASA OCHMO-TB-008 Rev A (29 Nov 2023), p. 3 |
| `dashboard.png` | 17 | Everything in `verdict-burned.png` and `key-numbers.png` | As above |
| | | µg; 0.17 g; 0.38 g | Standard values, as used in the app (`MISSIONS`) |
| | | 20 tests match (ISS, Mars transit); No tests match (Moon base, Mars base) | Computed by the app from Table 5.1 |
| | | 14.7 psi · 21% O₂ | Standard values, as used in the app (`AIRS.earth`) |
| `gap-gravity-luci.png` | 18 | More than 25 seconds; 2025 | NASA (2025), Lunar Combustion Investigation (LUCI), NTRS 20250010653 |
| `gap-where-the-data-is.png` | 18 | About 10 psi and 26% O₂ on Saffire V | NASA ICES-2024-365, Table 1 (70.7 kPa and 26.2%) |
| | | About 8 psi and 29–31% O₂ on Saffire VI | NASA ICES-2024-365, Table 1 (54.1–55.2 kPa and 28.8–31.0%) |

## 4. Links

| Source | Link |
|---|---|
| NASA/TM-20210011385, the BASS-II summary report | https://ntrs.nasa.gov/citations/20210011385 |
| Scientific Reports (2018), “The Effect of Gravity on Flame Spread over PMMA Cylinders” | https://www.nature.com/articles/s41598-017-18398-4 |
| NASA evidence report (2015), NTRS 20150021491 | https://ntrs.nasa.gov/citations/20150021491 |
| NASA OCHMO-TB-008 Rev A, Fire Protection (29 Nov 2023) | https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-008-fire-protection.pdf |
| NASA ICES-2024-365, Saffire VI preliminary results | https://ntrs.nasa.gov/citations/20240002981 |
| NASA (2025), Lunar Combustion Investigation (LUCI) | https://ntrs.nasa.gov/citations/20250010653 |

## 5. What isn't verified yet

- No person has checked these rows. The checks above were made by Claude Code.
- The provenance file for Table 5.1 (`data/provenance.json`) says an independent check of the columns other than oxygen is still pending.
