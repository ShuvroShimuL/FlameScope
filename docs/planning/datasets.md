# Datasets: access, validity and novelty

Which NASA and partner datasets should Will It Burn? use next? This map scores each candidate on the three stress-test lenses from the 18 Sept team meeting: **data access**, **scientific validity** and **novelty**. It answers open question **Q2** in [decisions.md](decisions.md), and it feeds roadmap items R3 and R6.

**Status:** researched on 2026-09-24 with Claude Code (see [AI_USE.md](../AI_USE.md)). **✔** means the quote or number was checked against the source document that day. Every other row comes from the research pass and carries its link. All of it still needs the second-person check before it reaches the screen or the video ([ADR-007](decisions.md)).

## 1. What a dataset has to do for us

- **The product.** Will It Burn? checks a cabin against an evidence envelope derived from data. It answers **Burned** or **No data**, and every number traces to a source row (ADR-005, ADR-009).
- **Today's envelope.** One set: 20 BASS-II PMMA sheets (PSI-25), in microgravity, at O₂ 16.8–22.2 % and about 14.7 psi, with *opposed* flow at 2–21 cm/s and sheets 1–5 mm thick.
- **The challenge.** The published summary asks for a dashboard that "summarizes, ranks, and interprets those findings to deliver fire safety insights for human space exploration" ✔. Its resources tab is still empty, and the full statement arrives on 28 Oct.

| Lens | A dataset passes when | What it protects |
|---|---|---|
| **Data access** | Anyone can read it without a paid account. The numbers are in a printed table or a machine-readable file, not only in plots or raw video. We may commit transcribed values, and they are small enough to ship offline. | NFR-02 (offline), ADR-002, a repo that opens for a stranger |
| **Scientific validity** | It is a primary source: a NASA TM or TP, a peer-reviewed paper or a DOI dataset. It states gravity, O₂, pressure, flow speed **and direction**, and thickness. It reports repeats or uncertainty. It is the same regime as the rows it joins, or it stays a separate set. | Rules 2 and 3, NFR-05, the Validity score |
| **Novelty** | It turns a current **No data** into evidence, adds another agency or a third party, or unlocks something new (ranking materials, partial gravity). | Creativity, Relevance and NASA data usage |

✅ passes · 🟡 partly · ❌ fails

## 2. The map

### 2a. Microgravity and partial-gravity fire data (the evidence core)

| Dataset | Access | Validity | Novelty: the gap it closes | Verdict |
|---|---|---|---|---|
| **BASS-II Table 5.1** (NASA/TM-20210011385, PSI-25) | ✅ Free NTRS PDF, US Government work. The PSI data is CC0 (§2d). | 🟡 NASA TM. The table has no uncertainty, pressure or temperature. All 40 of our O₂ values match NASA's PSI-25 CSV ✔. The other columns still await the PDF check (roadmap P2). | Baseline. The same report has more tables we haven't used (§5). | **In use, and extend it** |
| **Saffire IV–VI** (uncrewed Cygnus. [ICES-2021-266](https://ntrs.nasa.gov/citations/20210011521), [ICES-2024-365](https://ntrs.nasa.gov/citations/20240002981)) | ✅ Free PDFs. Test conditions are in numeric tables ✔. | 🟡 NASA-led, with ESA ESTEC, ZARM, CNRS, UCL, Hokkaido University and others ✔. The results are called "preliminary", and Saffire VI reports one test in detail. Two ICES papers give different conditions for test V-4. Samples are 18–50 cm, with **concurrent** flow at 20 cm/s in every test but V-4, which is opposed ✔. | ✅ **Reduced pressure and raised oxygen.** Saffire V: about 70.7 kPa (10.3 psi) and 26.2 % O₂ ✔. Saffire VI: 54.1–55.2 kPa (7.8–8.0 psi) and 28.8–31.0 % O₂ ✔. Also heat release, CO and CO₂ rise, cotton and SIBAL fabrics, and a Nomex sample that "did not ignite" ✔. | **Second new set**, after more BASS-II (§5). Keep it separate from BASS-II. |
| Saffire I–III (2016–17) | ✅ ICES papers are free. The data is on PSI (PSI-98 to 100, CC0), and Saffire II's CSV includes outcomes. | ✅ NASA-led, international team | 🟡 Large SIBAL sheets at about 21 % O₂. Saffire II burned nine small samples of several materials, including silicone, Nomex and 1 cm PMMA. | Candidate for **materials** (Saffire II), as a separate set |
| **SoFIE** (ISS Combustion Integrated Rack. Sub-studies GEL, MIST and others. [NTRS 20200000361](https://ntrs.nasa.gov/citations/20200000361)) | 🟡 The GEL paper is open (CC BY-NC-ND), but its results are plots. No public raw data found. | ✅ Peer-reviewed | ✅ GEL covered 13–34 % O₂, 0.15–1.1 atm and 0.2–80 cm/s on 4 cm PMMA spheres, but only the 1 atm map is published. No MIST results yet. | **Cite now.** Transcribe when tables or PSI data appear. |
| Confined Combustion (BASS hardware in the glovebox, 2019. [MST 2024](https://doi.org/10.1007/s12217-024-10106-y)) | ✅ Open article (CC BY) | ✅ Peer-reviewed, 63 tests. Plots only. | Confinement, and slow opposed flow at 2.6–10.5 cm/s over SIBAL and 1 mm PMMA | Cite only |
| **LUCI** (spinning Blue Origin New Shepard, 2025. [NTRS 20250010653](https://ntrs.nasa.gov/citations/20250010653)) | ✅ NTRS presentation | 🟡 One flight, slides only | ✅ **Lunar gravity.** "The first-ever, extended-duration (greater than 25 seconds) combustion tests performed in simulated Lunar gravity", on a cotton-fibreglass sheet and a 4 mm PMMA rod in air ✔. The follow-on, FM2 on the Moon, is "planned to launch in late 2026" ✔. | **Cite now** in the gravity gap card |
| Partial-gravity PMMA rods (Olson et al., *Fire Safety Journal* 150, 104267, 2024) | ❌ Closed access ✔ | ✅ Peer-reviewed | 0.04–1 g, 13.2–15.2 % O₂, about 57.6 kPa. Lunar gravity sits near the minimum of the O₂–gravity flammability boundary (from the indexed abstract). | Cite only. It's already cited; see the wording fix in §4. |
| Parabolic-flight partial gravity (Feier et al., *PCI* 29, 2002. Konno et al., *PCI* 39, 2023, on CNES flights. [UCL copy](https://discovery.ucl.ac.uk/id/eprint/10154634/)) | ✅ Free NASA STI copy and UCL manuscript | ✅ Peer-reviewed, with tables and plots. Each parabola gives about 20–30 s of partial gravity. | 0.1, 0.16 and 0.38 g over thin cellulose at 0.2–0.4 atm. Polyethylene wire insulation at 0–1 g. | Candidate for a **partial-gravity** set, labelled short-duration |
| SSCE (Shuttle, 1990–95. [NTRS 19960008387](https://ntrs.nasa.gov/citations/19960008387)) | ✅ NTRS | ✅ NASA. Plots only. | **Still air:** flame spread over paper and PMMA in quiescent microgravity, at 1–2 atm and O₂ up to 50 % | Cite it in the still-air gap card, in place of the candle image |
| MSC (Shuttle STS-69 and STS-77. [eScholarship](https://escholarship.org/uc/item/6t2213hg)) | ✅ Free postprint | ✅ *Combustion and Flame* 116 (1999), Tables II–III | **Foam** smouldering in still air at 35–40 % O₂ | Candidate, as its own smouldering set (smouldering isn't flaming) |
| JAXA FLARE (Kibo. [JAXA page](https://humans-in-space.jaxa.jp/en/biz-lab/experiment/theme/detail/000807.html)) | 🟡 The papers are open. No public JAXA data found. | ✅ Peer-reviewed | A partner agency. It measures the lowest O₂ that sustains a flame. Filter paper is published; wire insulation is to come. | Cite only, as partner context |

### 2b. Earth-gravity materials data (1 g only: never inside the microgravity envelope)

| Dataset | Access | Validity | Novelty | Verdict |
|---|---|---|---|---|
| NASA-STD-6001B Test 1 and the MAPTIS database ([standard](https://standards.nasa.gov/standard/NASA/NASA-STD-6001)) | 🟡 The standard is public. MAPTIS needs an account, and non-NASA users pay. | ✅ NASA standard, 1 g pass or fail | Many materials, high O₂ and 8.2 psi, but at 1 g. The Saffire IV/V authors say the test "cannot be assumed to indicate that a material will not burn under those conditions in low gravity" ✔. | Cite the standard. Don't build on MAPTIS. |
| WSTF oxygen-limit data (Hirsch 2007, [NTRS 20070018178](https://ntrs.nasa.gov/citations/20070018178). NESC TB 26-05) | ✅ Public, in a numeric table | ✅ NASA | The highest O₂ at which about 24 materials pass (Ultem, Nomex HT90-40, foams and others), at 70.1 kPa and 30–40 % O₂ | Candidate for a clearly labelled **Earth screening** line on material gap cards |
| NIST Fire Calorimetry Database ([nist.gov/el/fcd](https://www.nist.gov/el/fcd)) | ✅ Free CSV, DOI 10.18434/mds2-2314 | ✅ Uncertainty documented | Heat release of real objects at 1 g | Context only |

### 2c. Earth context and impact (the Bangladesh framing)

| Dataset | Access | Validity | Use | Verdict |
|---|---|---|---|---|
| FSCD annual fire statistics, 2015–2025 ([fireservice.gov.bd](https://fireservice.gov.bd/pages/files/6922dbb2933eb65569e0beb4)) | 🟡 Public PDFs in Bangla. Most pages of the 2024 file are scanned images, so they need OCR. | ✅ Official | Local fire numbers for FR-14 | **Use**, with the ADR-007 check |
| NASA FIRMS (VIIRS 375 m, MODIS 1 km. [Earthdata](https://www.earthdata.nasa.gov/data/tools/firms)) | ✅ Free MAP_KEY | ✅ for landscape fires. ❌ for single buildings: a building is far smaller than a pixel, and NASA applies "slightly more conservative tests" over "metallic factory rooftops". | Satellite hotspots | Don't use it for building-fire claims |
| NASA history and Lessons Learned (Mir 1997) ([NASA history](https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/)) | 🟡 The LLIS pages need JavaScript. The history page is readable. | Narrative only | A story, not data | Context only |

### 2d. NASA Physical Sciences Informatics (the teammate's link)

**Access ✅.** PSI data is public, needs no login, and is licensed **CC0-1.0**. The PSI-25 record says `public: true` and `licenseIdentifier: CC0-1.0` ✔. The [search page](https://psi.nasa.gov/physci/repo/search?q=&data_source=psi&data_type=investigation) is a JavaScript app, but the JSON API behind it is open:

| Call | What it returns |
|---|---|
| `GET https://psi.nasa.gov/geode-py/ws/repo/search?source=psi&type=investigation&from=0&size=200` | Every investigation (132 on 24 Sep) |
| `GET https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-25` ✔ | DOI, licence, publications, the file list and the curated "Experimental table" CSV |
| `GET https://psi.nasa.gov/geode-py/ws/studies/PSI-25/download?file=<name>&redirect=false` ✔ | A short-lived S3 link to one file |

Files range from an experimental-table CSV of 0.2–31 KB up to raw video and images; BASS-II's full archive is 274.6 GB. Files over 5 GB arrive as an emailed link. No terms-of-use page was found. NTRS marks TM-20210011385 as public, with no ITAR or EAR flag.

**A validity win we already have.** NASA's PSI-25 experimental table lists M1–M20 with calibrated initial and final O₂. All 40 values match `data/bass-table.csv` exactly ✔. The table also gives CO before and after every test (for example, M4 went from 2 to 561 ppm) ✔, which we don't use yet. It records flow as a fan display reading, not cm/s, so it can't replace Table 5.1.

| PSI | Investigation | What burned (or didn't) | Regime vs BASS-II | Outcomes in a file? | Verdict |
|---|---|---|---|---|---|
| PSI-25 | BASS-II (ISS glovebox, 2014) | PMMA films, sheets and rods; SIBAL fabric; Nomex III; a wax candle. O₂ 13.6–22.2 %, flow up to 40 cm/s. | Same | The CSV covers 129 tests (conditions, O₂, CO₂, CO) but has no outcomes. The outcomes are in the report's tables. | **Extend now** (see §5) |
| PSI-26 | BASS (ISS glovebox, 2012–13) | SIBAL, Nomex, Ultem, PMMA, paraffin and Japan wax, and a nitrogen-jet suppression test. O₂ 15.9–22.7 %. | Same rig | 124 free-text notes in an "As-Run" spreadsheet | Candidate. A person must check every row we code. |
| PSI-98 to PSI-100 | Saffire I–III (Cygnus) | Large SIBAL sheets (I, III). Nine small samples in II, including silicone, SIBAL, PMMA with Nomex, and 1 cm PMMA. | Different: large samples, concurrent flow | **Saffire II's CSV includes outcomes**, for example "Nomex was not ignited", and a silicone burn length of "~0" | Candidate for materials, as a separate set |
| PSI-102 / PSI-101 | SAME / SAME-R | Smoke made from Teflon, Kapton, silicone rubber and other materials. NASA calls each run a "combustion event". | Smoke, not flame spread | SAME's table has 8 rows. SAME-R completed "66 test points". | **Used** on the fire-response card, for detection (step 1). Never for "will it burn". |
| PSI-20 | ACME BRE | Gas burners that mimic burning solids in still air, including at **8.2 psia and 34 % O₂** | Gas burner | The report's tables are a test log; the results are in prose | Cite only. The atmosphere matches the exploration cabin, but it isn't a solid fuel. |
| PSI-69, PSI-68, PSI-39 | FLEX, FLEX-2, CFI | Fuel droplets | Different: droplets and cool flames | FLEX's table has 274 tests with outcomes; 123 add CO₂ and 50 add helium. FLEX-2's table is only an 8-row summary of fuels and ranges. | FLEX is **used** for the suppressant line on the fire-response card (step 5), from `data/psi-69-flex.csv`. Keep all three out of the solid-fuel envelope. |
| PSI-10, 21–23, 159, 106, 107 | ACME gas flames, SLICE, SPICE | Gas jets | Different: gas flames | — | Don't mix |
| PSI-47, PSI-179 | DAFT, ASE | Dust and cabin aerosols | Not fire | — | Context for detection only |

All PSI DOIs start with `10.60555/`. The IDs and DOIs come from the PSI API.

**What PSI can't give us for solids:** partial gravity (there's no combustion study), pressures other than about 1 atm, O₂ well above 22 %, and paper, Mylar, Velcro, nylon, foam or wire insulation.

**Carry these data-quality notes into provenance:**
- PSI-25 records flow as a fan display reading.
- PSI-98's dates look copied from another study.
- Saffire thickness columns have typos ("037 mm").
- PSI-10 has no licence field.
- PSI-25's table gives B2's final O₂ as 1.6 %, which looks like a column slip. B2 isn't one of our 20 rows.
- PSI's descriptions give nominal widths (1 cm, 2 cm) where our Table 5.1 transcription has 1.2 and 2.2 cm. Confirm this in the reviewer check (P2).
- PSI-69's table is Windows-1252 text and writes an en dash for "no value". Its gas headers have lost their subscripts: "O", "N" and "CO" are O₂, N₂ and CO₂.
- PSI lists Saffire-I and Saffire-III under the ISS platform, but Saffire ran inside uncrewed Cygnus ships (Saffire-II is listed correctly).

### 2e. Coverage: PSI's 19 flight combustion investigations

PSI lists 19 flight investigations under Combustion Science, plus 5 ground or modelling studies (PSI-60, 62, 115, 117 and 142). The team's infographic lists ACME CFI-G twice and leaves out DAFT.

| PSI | Investigation | Used in the app | Next |
|---|---|---|---|
| 25 | BASS-II | ✅ Evidence: 20 acrylic tests (Table 5.1), 27 fabric tests (Table 7.1), 3 Nomex tests (Table A.2) and the extinction speeds (Table 2.1). O₂ cross-check against NASA's table. | Its rod tests are in figures only |
| 26 | BASS | 🟡 Cited on the fire-response card (nitrogen jet, sensitivity to airflow) | Its 122 rows record outcomes only as free-text notes |
| 99 | Saffire-II | ✅ "Also seen in another experiment" lines beside acrylic, SIBAL and Nomex answers, and the silicone gap card | Keep it beside answers. Its O₂ is derived from CO₂. |
| 98, 100 | Saffire-I, Saffire-III | ❌ | Context only. The tables have 4 and 2 rows. |
| 69 | FLEX | ✅ Suppressant line on the fire-response card | A separate liquid-fuel view is possible later |
| 102, 101 | SAME, SAME-R | ✅ Detection line on the fire-response card | none |
| 47 | DAFT | ❌ | none. It was an instrument check ahead of SAME, with no fire data. |
| 20 | ACME BRE | ❌ | Context only: gas burners that imitate burning solids in still air |
| 10, 21, 22, 23, 159 | ACME Flame Design, CLD, E-FIELD, s-Flame, CFI-G | ❌ | Not for Will It Burn? These are gas and cool-flame science. |
| 39, 68, 106, 107 | CFI, FLEX-2, SLICE, SPICE | ❌ | Not for Will It Burn? These are droplet and gas-jet flames. |

## 3. Evidence behind NASA's fire response (for the proposed safety feature)

**Status:** built on 2026-09-24 as feature F-01 ([ADR-010](decisions.md)). The app quotes the steps below from `data/fire-response.json`, with the evidence that was checked against its source.

NASA does publish an ordered ISS fire response. **OCHMO-TB-008 Rev A, *Fire Protection* (29 Nov 2023)** ✔ says: "For a fire on ISS, the following actions will be taken sequentially by the crew until the fire is extinguished." The brief is marked "for reference only", and the crew's actual procedures (Emer-1) aren't public. [PDF](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-008-fire-protection.pdf).

| NASA's step, in its order | What microgravity data says | Evidence |
|---|---|---|
| 1. Fire detection and warning | Saffire VI: smoke "was readily detected … but a typical alarm threshold was only achieved at 981 seconds" ✔. SAME and SAME-R (PSI-102, PSI-101) made smoke from Teflon, Kapton, silicone rubber and other materials, to give "quantitative data on the sensitivity of these detectors to reduced gravity smokes" ✔. | Some evidence |
| 2. Terminate ventilation "to slow the spread of fire" ✔ | **Mixed.** Friedman ([NASA/TM-1999-209285](https://ntrs.nasa.gov/citations/19990063738)): flames over solids "tend to self-extinguish when flow ceases", but whether that works on an established fire is "unknown". Saffire IV/V: the fan was off for 70 s ✔ and the flame grew back. "Extinction of the fire cannot be assumed to occur quickly under quiescent conditions" ✔, and low flow can build fuel vapour into "a readily-ignited mixture that can produce a strong deflagration" ✔. BASS-II report, Table 2.1: flames over thin PMMA went out below a critical opposed-flow velocity that depends on O₂ ✔ (check the values in the PDF). BASS-II Table 5.1: spread was slower at lower flow, but flow and test time are confounded, and still air was never tested. | Mixed |
| 3. Don protective masks | Saffire VI: "the heat from the fire is not the principal hazard and rather the smoke and gaseous products are a much greater concern" ✔. PSI-25 gives the CO before and after each BASS-II test, measured inside the glovebox rather than a cabin ✔. | Supports the reason for the step |
| 4. Manually remove electrical power | Nothing in these sets | No data |
| 5. Use fire extinguishers (CO₂ in US modules, water-based in Russian modules, per this brief) | BASS: a 500 cc/min nitrogen jet "weakens but does not extinguish the flame" ([NTRS 20140011099](https://ntrs.nasa.gov/citations/20140011099)). The raw BASS notes are in PSI-26. FLEX (PSI-69) burned fuel droplets, not solids: 123 of its 274 tests added CO₂ and 50 added helium, to "determine how the presence of a suppressant influences the LOI" ✔. No microgravity comparison of CO₂ and water mist was found, and SoFIE-MIST has no published results yet. | Related tests only |
| 6. Power down the module | Nothing in these sets | No data |
| 7–8. Isolate the module until CO, HCN and HCl are scrubbed | Saffire VI measured the CO rise against NASA's limits: "the 1-hour SMAC is 425 ppm, and the 24-hour SMAC is 100 ppm" ✔ | Supports the reason for the step |

**What the app may do:** quote one dated NASA list exactly as published ("NASA describes ISS crews doing…"), and show the evidence next to each step. **What it must not do:** re-order, merge or rank the steps, speak in the imperative, or turn **Burned** into a danger level. Sources from different years disagree on details. For example, a 2020 NASA JSC paper says cabin fires get water mist and rack fires get CO₂ ([NTRS 20200011599](https://ntrs.nasa.gov/citations/20200011599)). So any card must name its source and year.

## 4. Fact-check of what the app shows today

**Status:** claims 1 and 3–6 were fixed in the app on 2026-09-24, and claim 2 was already right. A regression test in `test/scenario.test.mjs` pins the new wording and sources.

| # | Where | Shown today | Verdict | Evidence | Suggested text |
|---|---|---|---|---|---|
| 1 | Gap card (`scenario.mjs` `gapsFor`) | "Saffire V and VI burned samples at about 8.2 psi and 34% O₂ inside uncrewed Cygnus ships." | ❌ **Wrong** ✔ | ICES-2024-365, Table 1: V-2 at 70.7 kPa and 26.2 %; VI at 54.1–55.2 kPa and 28.8–31.0 % | "Saffire V and VI burned samples at reduced pressure and raised oxygen inside uncrewed Cygnus ships: about 10 psi and 26 % O₂ on V, and about 8 psi and 29–31 % O₂ on VI." |
| 2 | Gap card | "SoFIE … can test exploration atmospheres at reduced pressure." | ✅ Supported | NTRS 20200000361: the rack "permits testing at variable oxygen concentrations and pressures representative of current and planned NASA Space Exploration Atmospheres" | Keep |
| 3 | Gravity gap card | "NASA Glenn's centrifuge drop tests give only about five seconds of Moon-like gravity at a time." | 🟡 Out of date ✔ | The 5.18 s drop is right, but LUCI (2025) burned for more than 25 s in simulated lunar gravity | Add: "The first lunar-gravity burns longer than 25 seconds flew on a spinning suborbital rocket in 2025," citing LUCI |
| 4 | Gravity gap card | "Lunar-level gravity may be a worst case: enough rising gas to feed a flame, not enough to blow it out." | 🟡 Needs scoping ✔ | FSJ 2024 covers PMMA rods at about 57.6 kPa and 13–15 % O₂. The "feed but don't blow out" mechanism comes from a NASA white paper (Miller, Olson, Johnston), not from this paper. | "For acrylic rods, early centrifuge results put lunar gravity near the worst case." |
| 5 | "Why it matters" line (`ask()` `why`) | "…kept acrylic rods burning at 17% O₂ in orbit, below the 18% they needed on the ground." | 🟡 Imprecise ✔ | *Sci. Rep.* 2018: "flame cannot exist in normal gravity for X_O2 = 18% and below" | "…burning at 17 % O₂ in orbit. On the ground, the same rods went out at 18 % and below." |
| 6 | Exploration air (C-03), the Moon mission note, `SOURCES.atmosphere` | "8.2 psi at 34% O₂", citing NASA/TP-2010-216134 | 🟡 Right numbers, wrong citation ✔ | The TP recommends "8.0 psia, 32% oxygen". [NTRS 20150021491](https://ntrs.nasa.gov/citations/20150021491): "After re-evaluation in 2012, the 8/32 environment was altered to 8.2 psia and 34% O2". | Cite NTRS 20150021491, and keep the TP as history |

## 5. Recommendation

1. **Fix the claims in §4.** Done on 2026-09-24.
2. **Turn the PSI match into a test.** Done on 2026-09-24: `src/acquire/psi.mjs` fetches the table through `safe.mjs`, the fixture is committed, and `test/psi.test.mjs` runs the check. A UI badge for FR-12 is still open.
3. **Next evidence: more of the same BASS-II report (this answers Q2).** It's the same report, DOI and rig, so the provenance stays simple.
   - Table 7.1 lists 27 SIBAL fabric tests, "including six quenching tests, three nonignited tests, and one blowoff test" ✔. They add cotton-blend fabric, flows above 21 cm/s and O₂ below 16.8 %.
   - §3.1 says "The three Nomex® samples did not ignite" ✔.
   - Table 2.1 gives the critical opposed-flow velocity at which thin-PMMA flames go out ✔.

   These bring outcomes the app can't show yet ("went out", "didn't ignite"). They need a new verdict design that never reads as "safe" (rule 4). Quote the observation, not the report's own comment that it's "an excellent result for fire safety". Size M.
4. **Then add Saffire IV–VI as a separate set**, for reduced pressure and raised O₂. It's printed, free and international. Keep it separate, because its flow is concurrent and its samples are 18–50 cm long. Even then, 8.2 psi at 34 % stays **No data**, since Saffire VI peaked at 31 %. The honest answer becomes "closest evidence: Saffire VI at about 8 psi and 29–31 % O₂". Size L.
5. **Upgrade two gap citations.** Use LUCI in the gravity card and SSCE in the still-air card. Size XS.
6. **Watch SoFIE.** It covers 34 % O₂ at low pressure, but only plots are public so far.
7. **Bangladesh:** take the numbers from FSCD, and drop FIRMS from the building-fire framing.
8. **Add FLEX and SAME to the fire-response card.** Done on 2026-09-24.
9. **Transcribe the rest of the BASS-II report.** Done on 2026-09-24:
   - Table 7.1, SIBAL fabric (p. 96)
   - Table A.2 with §3.1.1, Nomex (pp. 105 and 46)
   - Table 2.1, extinction speeds (p. 28)

   Each was checked against the PDF page image. Fabric now answers Mixed (20 of 23 tests burned) and Nomex answers No flame held (0 of 3), per ADR-011. Table A.2 prints an impossible 0.9 as F3's final O₂; PSI-25 leaves it empty, and so do we.
10. **Add Saffire-II.** Done on 2026-09-24. NASA's PSI-99 table is saved unchanged, and its results sit beside answers, never inside them (FR-19):
    - Nomex "was not ignited".
    - SIBAL spread at 2.1 and 2.6 mm/s.
    - Thick acrylic flames stayed "anchored at the base".
    - Silicone didn't spread in orbit in any of 4 samples, while 3 of 4 burned on the ground. The FLEX line is computed from NASA's own table (`data/psi-69-flex.csv`).

## 6. Review of the dataset recommendations file (2026-09-24)

A teammate shared *FlameScope Dataset Recommendations.md*. We checked its claims against the PSI records and tables.

**Agree:**
- Don't claim Moon or Mars behaviour.
- Keep droplet data out of the solid-fuel view.
- Label descriptive comparisons as descriptive.
- Track an access state for each source: metadata, structured record, or raw file verified.
- Add study-level IDs.
- Treat SoFIE as metadata until a PSI record exists.

Its schema fields `investigation_id`, `measurement_type`, `access_state`, `source_location` and `independence_group` should be added before a second investigation joins the evidence.

**Corrected:**
1. **The PSI-25 table has no outcomes.** It lists 129 tests (not 130) with O₂, CO₂ and CO only. Flow is a fan-display reading, not cm/s, and there's no flow-direction column. The results are in the report's tables, so step 2 transcribes those.
2. **FLEX (PSI-69) is a better droplet source than FLEX-2 (PSI-68).** FLEX-2's table is an 8-row summary of fuels and ranges with no outcomes. FLEX has 274 test rows with outcomes.
3. **Saffire-II (PSI-99) details:**
   - All 9 samples ran at 20 cm/s, and all but one had the flow running with the flame.
   - O₂ is "derived from measured CO2 production", not measured directly.
   - The cells are free text and need hand-coding.
   - 6 of the 15 rows are notes or flow-visualisation rows, not samples.
4. **Missing sources:** it leaves out Saffire IV–VI, which hold the only reduced-pressure data, and it leaves out FLEX's suppressant tests, SAME and LUCI.
