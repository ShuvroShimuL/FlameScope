# data/evidence/fixtures/

NASA's own records, committed as fetched, so the checks that depend on them run offline on a clean clone.
They are never presented as live data: anything that quotes them labels its source `fixture`.

| File | Fetched from | Contents | Used by |
|---|---|---|---|
| `ntrs-20210011385.json` | NASA NTRS citation API, 2026-09-23 | Citation record for the BASS-II Summary Report (NASA/TM-20210011385) | `scripts/mcp-server.mjs` (`get_provenance`), `tests/evidence/boundary.test.mjs` |
| `psi-25-experimental-table.json` | NASA PSI download API, 2026-09-24 | NASA PSI-25 "Experimental table" CSV (CC0-1.0, 129 tests), stored as one JSON string | `tests/evidence/psi.test.mjs` and `sets.test.mjs`, which check our transcribed O₂ values against it |

The transcribed BASS-II rows live one level up, in `data/evidence/`, because they are source data, not a fetch
result. The original FlameScope fetched these files at run time (live, then cache, then fixture). That fetch layer
was retired in the HEARTH integration; the modules that produced these files are in git history at `fdce8c5`
(`src/acquire/ntrs.mjs`, `src/acquire/psi.mjs`).
