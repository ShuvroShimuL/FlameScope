---
name: add-nasa-dataset
description: Add a new NASA (or third-party) data source or new evidence rows to FlameScope with an acquire module, offline fixture, provenance record and reproduction tests. Use when asked to add a dataset, transcribe a table (Saffire, SoFIE, FIRMS, FSCD…), or fetch new data.
---

# Add a NASA dataset

## Decide the path

- **Tabular values from a report or PDF** → transcribe into `data/<name>.csv` with `data/<name>.provenance.json`. Don't fetch at runtime.
- **An API or file download** → write `src/acquire/<source>.mjs` that calls `fetchJson` (or `fetchText` for CSV and other text files) from `./safe.mjs`, and commit a fixture. `src/acquire/psi.mjs` is a worked example.

## Steps

1. **Provenance first.** Record the title, agency, URL, DOI, table and printed page, the access date (YYYY-MM-DD), the method, the verification status ("pending second-person check" until done) and the limitations. Copy the shape of `data/provenance.json`. If you save NASA's own file unchanged, record its SHA-256 and name it `data/psi-<n>-<name>.csv`. `.gitattributes` keeps those bytes exact, line endings included, so the hash still matches after a clone.
2. **Schema.** Keep the source units in the CSV and normalise only in the loader. Blank means `null`, never 0. Use `;`-lists for paired arrays and document the pairing. Add the columns to `docs/planning/data-model.md`.
3. **Acquire module** (API sources only):
   ```js
   import { fetchJson } from './safe.mjs';
   export async function thing(args) {
     const { data, source } = await fetchJson(URL, { params, name: 'thing-<stable-key>' });
     return { ...pick(data), source };   // always carry `source` to the caller
   }
   ```
   Keys come from `process.env` inside `acquire/` only. Add the variable name to `.env.example`.
4. **Fixture.** Run the module live once, then copy `cache/<name>.json` → `demo_fixtures/`. Add a row to `demo_fixtures/README.md`.
5. **Loader in `src/compute/`.** It must be a pure function over `data/` (see the `compute-boundary` skill). Attach `sourceLocation` and `missing[]` to every record.
6. **Tests.** Reproduce at least two published values exactly. Test that missing values stay `null`. Test with `OFFLINE=1` against the fixture.
7. **Surface it.** Add it to the sources table in `docs/planning/data-model.md`, to the provenance drawer, and to the README's "Datasets used." If it's a non-NASA source, note it on the scorecard's NASA data usage row.
8. **Log it** in `docs/AI_USE.md` if AI helped with the transcription.

## Done when

`node --test` is green, the fixture is committed, `OFFLINE=1` works, and the provenance is visible in the UI.
