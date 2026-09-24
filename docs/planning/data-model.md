# Data model

## Sources

| Source | Agency | Used for | How it enters | Licence |
|---|---|---|---|---|
| NASA/TM-20210011385, *BASS-II Summary Report*, Table 5.1 (printed p. 57) and §5.3 (p. 56) | NASA | All 20 test rows | Hand-transcribed into `data/bass-table.csv` | US Gov work, public |
| The same report: Table 7.1 (p. 96), §3.1.1 (p. 46), Table A.2 (p. 105) and Table 2.1 (p. 28) | NASA | SIBAL fabric and Nomex answers, and the extinction speeds | Transcribed into `data/bass-fabric.csv`, `bass-nomex.csv` and `bass-extinction.csv` | US Gov work, public |
| [PSI-25 dataset](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25), DOI 10.60555/4qc4-de67 | NASA PSI | Related dataset reference | Cited only. The raw archive is not downloaded. | NASA PSI terms |
| NTRS citation API, `ntrs.nasa.gov/api/citations/20210011385` | NASA | Live confirmation of report metadata | `src/acquire/ntrs.mjs`, fixture committed | Public |
| NASA evidence report (2015), [NTRS 20150021491](https://ntrs.nasa.gov/citations/20150021491) | NASA | Exploration atmosphere: 8.2 psia and 34% O₂, set in 2012 in place of the 8.0 psia and 32% of NASA/TP-2010-216134 | Cited constant in `scenario.mjs` | Public |
| Saffire VI results, ICES-2024-365 ([NTRS 20240002981](https://ntrs.nasa.gov/citations/20240002981)), and the SoFIE page (NASA Glenn) | NASA, with ESA ESTEC and partner universities | "Where the data is" gap card: Saffire V and VI test conditions (Table 1) | Cited link | Public |
| LUCI, lunar-gravity burns ([NTRS 20250010653](https://ntrs.nasa.gov/citations/20250010653)) | NASA | Partial-gravity gap card | Cited link | Public |
| PSI-25 "Experimental table" ([PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25), DOI 10.60555/4qc4-de67) | NASA PSI | Cross-check of the 40 transcribed O₂ values | `src/acquire/psi.mjs` through `safe.mjs`, fixture committed | CC0-1.0 |
| OCHMO-TB-008 Rev A, *Fire Protection* (29 Nov 2023) | NASA | The eight ISS fire-response steps, quoted | Transcribed into `data/fire-response.json` | Public |
| Saffire-II experimental table ([PSI-99](https://psi.nasa.gov/physci/repo/data/investigations/PSI-99), DOI 10.60555/2chp-m469) | NASA PSI | "Also seen in another experiment" lines, and the silicone gap card | NASA's file, saved as `data/psi-99-saffire-2.csv` | CC0-1.0 |
| FLEX experimental table ([PSI-69](https://psi.nasa.gov/physci/repo/data/investigations/PSI-69), DOI 10.60555/mbq8-0451) | NASA PSI | The suppressant line on the fire-response card (CO₂ and helium test counts) | NASA's file, saved as `data/psi-69-flex.csv` | CC0-1.0 |
| SAME ([PSI-102](https://psi.nasa.gov/physci/repo/data/investigations/PSI-102)) and SAME-R (PSI-101) records | NASA PSI | The detection line on the fire-response card | Cited in `data/fire-response.json` | CC0-1.0 |
| Saffire IV–V (ICES-2021-266), BASS ([NTRS 20140011099](https://ntrs.nasa.gov/citations/20140011099)), NASA emergency-response paper ([NTRS 20200011599](https://ntrs.nasa.gov/citations/20200011599)) | NASA, with partners | Evidence lines on the fire-response card | Cited in `data/fire-response.json` | Public |
| *Scientific Reports* (2018), gravity effect on PMMA cylinders | Third party (journal) | "Why it matters" line | Cited link | Open access |
| *Fire Safety Journal* (2024), partial-gravity PMMA rods | Third party (journal) | Partial-gravity gap cards | Cited link | Publisher |
| NASA FIRMS (planned) | NASA | Bangladesh active-fire context | `src/acquire/firms.mjs` (R3) | Open |
| FSCD Bangladesh statistics (planned) | Bangladesh Govt | Local fire numbers | Transcribed, with provenance (R3) | Public |

This mix meets the score sheet's rule of "NASA open data plus another agency or third-party source." The third-party sources are listed on the project page and in the provenance drawer.

## `data/bass-table.csv`: one row per BASS-II test

| Column | Type | Unit | Notes |
|---|---|---|---|
| `test_id` | string | none | `M1`…`M20` |
| `thickness_mm` | number | mm | 1–5 |
| `width_cm` | number | cm | Normalised to `widthMm` on load |
| `burning_sides` | int | count | 1 or 2 |
| `velocity_cm_s` | `;`-list | cm/s | Paired by position with the spread list |
| `spread_mm_s` | `;`-list or blank | mm/s | **Blank = not tracked, never 0** (M6, M12) |
| `burn_min` | number | min | |
| `initial_o2_vol_pct`, `final_o2_vol_pct` | number | vol % | Test endpoints, not a constant or per-segment level |

Synthetic example (not real data): `MX,2,2.2,2,10;6,0.050;0.041,20.0,21.0,19.5`

## Record, as loaded by `src/compute/evidence.mjs`

```ts
type Record = {
  id: string; studyId: 'BASS-II'; material: 'PMMA'; geometry: 'sheet'; flowDirection: 'opposed';
  thicknessMm: number; widthMm: number; burningSides: number;
  velocity: number[]; spread: number[] | null;       // same length when present
  burnMin: number; oxygenInitial: number; oxygenFinal: number;
  velocityUnit: 'cm/s'; spreadUnit: 'mm/s';
  uncertainty: null; pressure: null; temperature: null; rawMedia: null;   // not in the source
  sourceLocation: string;  // "Table 5.1, printed p. 57, row M7"
  source: string;          // NTRS URL
  missing: string[];       // shown on every card
};
```

## `data/provenance.json`

`title`, `investigation`, `version`, `accessed` (YYYY-MM-DD), `source`, `pdf`, `location`, `dataset`, `doi`, `method`, `verification`, `limitations[]`. The provenance drawer and `get_provenance` both serve this file verbatim.

## Derived: `ENVELOPE` (in `scenario.mjs`)

Computed from the records at load time, never typed in. It covers O₂ 16.8–22.2 %, pO₂ 17–22.5 kPa, airflow 2–21 cm/s, thicknesses {1,2,3,4,5} mm, microgravity, and about 14.7 psi. The pressure is **not in the table**. It is stated from where BASS-II ran, and the UI says so.

## Fetched: `cache/` and `demo_fixtures/`

| File | Written by | Committed? |
|---|---|---|
| `cache/<key>.json` | `safe.mjs` on every live success | No (gitignored) |
| `demo_fixtures/<key>.json` | Copied by hand from `cache/` | **Yes**. These are the exact bytes the demo needs. |
| `demo_fixtures/psi-25-experimental-table.json` | `node src/acquire/psi.mjs` (via `fetchText`), then copied | **Yes**. NASA's CSV, stored as one JSON string |

`key` is the `name` argument (for example `ntrs-20210011385`), or the md5 of the URL plus its sorted params.

## `/api/ask` response (summary)

`canonical`, `notices[]`, `understood[]` (field, value, from), `scenario`, `missions[]`, `checks[]` (key, yours, tested, ok), `verdict` (state `burned` | `no-data`), `evidence` (ids, stats, finding) or `null`, `findings` (tests, method, rule, caveat, `ranked[]` with tier, counts, caveat, ids and pairs) or `null`, `gaps[]` (topic, text, source), `nearest` or `null`. The full contract is in [will-it-burn-technical.md](../will-it-burn-technical.md) §8.

## `data/fire-response.json`

NASA's ISS fire-response steps, with the evidence for each. `src/compute/response.mjs` loads it, checks that the steps are in order, that each status is in the fixed list and that each source key exists, and serves it as `fireResponse` in `GET /api/data`.

- `source`: `name`, `date` (YYYY-MM-DD), `url`, `location`, `intro` (NASA's lead-in, verbatim) and `caveat`
- `method`, `verification`, `limitations[]`, `accessed`: provenance, in the same shape as `data/provenance.json`
- `sources`: a keyed list of `{ label, name, url }` for the evidence lines
- `steps[]`: `n` (NASA's number), `step` and optional `detail` (both verbatim), and `status` (`one` · `some` · `mixed` · `reason` · `related` · `none`)
  - `evidence[]`: `{ text, source }`, or `{ computed: key }` for a line computed at load. The keys are `bassIIAirflow` (from the BASS-II rows) and `flexSuppressants` (from `data/psi-69-flex.csv`). `source: null` is allowed only for a stated absence ("We found no …").
  - optional `differs`: `{ text, source }`

`GET /api/data` returns `records`, `provenance`, `fireResponse`, `findings` (the ranking from `src/compute/findings.mjs`: `{ tests, method, rule, caveat, ranked[] }`, served for every answer) and `aiAvailable`.

## BASS-II report tables: `data/bass-fabric.csv`, `bass-nomex.csv` and `bass-extinction.csv`

These are transcribed from NASA/TM-20210011385 and checked against the PDF page images. Provenance for all three is in `data/bass-ii-tables.provenance.json`. `src/compute/sets.mjs` loads them.

| File | Source | Columns | Loader rules |
|---|---|---|---|
| `bass-fabric.csv` | Table 7.1, p. 96: SIBAL fabric in concurrent flow, 27 BASS-II and 4 BASS tests | `test_number`, `width_cm`, `flow_cm_s` ("10 to 5" means start and end), `o2_vol_pct`, `o2_note`, `comment` (verbatim; a "-----" comment becomes blank) | The comment gives the outcome: burned, quenched, blow-off, no ignition or reused. Reused samples stay out of verdicts, as the report does. |
| `bass-nomex.csv` | §3.1.1, p. 46, and Table A.2, p. 105 | `test_number`, `date`, `sample_number`, `material`, `igniter`, `flow_configuration`, `fan_display`, `air_display`, `o2_initial_vol_pct`, `o2_final_vol_pct`, `notes` (verbatim) | Every row is "no ignition" (§3.1.1). Display readings are never used as cm/s. F3's missing final O₂ stays `null`. |
| `bass-extinction.csv` | Table 2.1, p. 28: extinction velocity for thin PMMA at 1 atm | `o2_percent`, `experiment_mm_s`, `experiment_uncertainty_mm_s`, `computation_mm_s`, `theory_mm_s` | Used on the still-air gap card and on the fire-response card |

`ask()` picks the evidence set for the material (`SETS` in `scenario.mjs`), and each set's envelope is derived from its own rows. Evidence for fabric and Nomex has `kind: 'outcomes'`, with `tests[]`, `counts` and a `finding`. Verdict states are `burned` · `mixed` · `no-burn` · `no-data`.

## `data/psi-99-saffire-2.csv`: NASA's Saffire-II table, unchanged

This is NASA's own PSI-99 table (CC0, 1,973 bytes, SHA-256 in `data/psi-99-saffire-2.provenance.json`). `src/compute/saffire.mjs` reads the 9 samples:

- A blank material repeats the row above.
- A burn length of "~ 0" means no spread. A length in cm, or "Complete", means burned.
- Notes 2 and 4 are quoted word for word.
- `saffireRelated(material)` returns one line shown beside an answer (`related` in `/api/ask`). It never changes the verdict (FR-19).

## `data/psi-69-flex.csv`: NASA's FLEX table, unchanged

This is NASA's own experimental table for FLEX (PSI-69), 274 droplet tests. Provenance, including the SHA-256 of NASA's original file, is in `data/psi-69-flex.provenance.json`. `src/compute/flex.mjs` loads it:

- The gas headers have lost their subscripts: `O`, `N` and `CO` are O₂, N₂ and CO₂ (mole fractions that add up to about 1). He is helium.
- NASA's en dash for "no value" becomes `null`, never 0.
- Fields kept: `test`, `fuel`, `pressureMmHg`, `o2`, `n2`, `co2`, `he`, `dropletMm` and `end` (Extinction, Disruption or Completion).
- These are droplets, not solids, so they never enter the acrylic envelope.

## Rules for adding data

1. One source per row set, recorded in a provenance file with page and table.
2. Keep the source's units. Normalise only on load, and document how.
3. Missing stays `null`, and it is listed in `missing[]`.
4. Add a test that reproduces at least two published values exactly.
5. Use the `add-nasa-dataset` skill (`.claude/skills/add-nasa-dataset/`).
