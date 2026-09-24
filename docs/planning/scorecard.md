# Score sheet → evidence map

Each criterion is mapped to what we show and where it lives. Update the **Status** column before submission.

| Criterion | Pts | What earns the top band | Our evidence | Status |
|---|---|---|---|---|
| Impact | 1–20 | Major problem, path to scale, measurable outcomes. Bangladesh framing with real numbers. | [vision-and-scope](vision-and-scope.md) problem and Bangladesh table. Path to scale: add evidence sets (Saffire, SoFIE) and the same envelope check for building fire data. Measurable targets in success measures. | 🟡 numbers need verifying |
| Creativity | 1–20 | A bold idea or unexpected connection. One surprising visual or interaction. | "A gap is an answer": the stamp flips **Burned → No data** when you tap Moon base, and the flame turns into a dashed question mark. An agent can drive the science over MCP without being able to invent it. | ✅ |
| Validity | 1–20 | Validated data and methods, working prototype, tested usability. The `src/compute` boundary and provenance drawer are the argument. | `src/compute` has no LLM, no network and no env (`test/boundary.test.mjs`). 58 tests, 20/20 eval, `provenance.json`, row-level sources. Ranked findings (E-07) come from fixed, tested rules. The 40 transcribed O₂ values match NASA's own PSI-25 table (`test/psi.test.mjs`). | 🟡 reviewer protocol and usability not run |
| Relevance | 1–20 | NASA data central and used creatively. Name the dataset on camera. | BASS-II, NASA/TM-20210011385 Table 5.1 (PSI-25), named in the first 30 s of the [demo-script](demo-script.md) | ✅ |
| Presentation | 1–20 | Clear beginning, middle and end, understood in 240 s | [demo-script.md](demo-script.md) | ⬜ rehearse and record |
| Teamwork | 1–5 | Roles and commits | Roles table in the [roadmap](roadmap.md). Everyone commits their own work. | ⬜ |
| User experience | 1–5 | Anyone can use it without training | One tap to an answer, two to refine it, three to the proof. Suggested questions. | 🟡 usability session |
| NASA data usage | 1–5 | NASA open data plus another agency or third-party source, clearly shown | NASA: BASS-II, the PSI-25, PSI-69 (FLEX) and PSI-99 (Saffire-II) experimental tables (via the PSI API), the SAME smoke records, NTRS, the OCHMO-TB-008 fire-protection brief, the 2015 exploration-atmosphere evidence report, Saffire IV–VI (with ESA ESTEC and partner universities), SoFIE, LUCI. Third party: *Sci. Reports* 2018, *Fire Safety Journal* 2024. Planned: FSCD Bangladesh. | ✅ (show in the drawer) |
| Challenge category named | 0/1 | State the 2026 challenge on the project page | README header, and the app's footer on every section. Still to state it on the project page. | 🟡 |
| Repository access | 0/1 | The link opens for a stranger with no login | Make the GitHub repo public and test it in a private window | ⬜ |
| Project page complete | 0/1 | Every field filled in and submitted | Space Apps project page | ⬜ |
| Women participation bonus | +5% | One or more women members | Team composition | _n/a or ✅_ |
