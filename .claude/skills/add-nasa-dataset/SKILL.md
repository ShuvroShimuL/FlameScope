---
name: add-nasa-dataset
description: Add a new NASA (or third-party) data source or new evidence rows to FlameScope with a provenance record, committed bytes and reproduction tests. Use when asked to add a dataset, transcribe a table (Saffire, SoFIE, FSCD…), or bring in a NASA file.
---

# Add a NASA dataset

## Decide which evidence set it belongs to

FlameScope keeps two sets and never pools them (ADR-017).

- **A PSI experimental table of gas or droplet flames, to be explored, ranked and mapped** → the processed set: add an adapter to `scripts/ingest/ingest.py`, put the raw files in `Pseudo_DataKeep/<INV>/`, document every mapping decision in `docs/DATA_NOTES.md`, and re-run the ingest to regenerate `data/processed/`. Never edit `data/processed/` by hand.
- **Tabular values about solid materials, to be matched row by row** → the evidence set: transcribe into `data/evidence/<name>.csv` with `data/evidence/<name>.provenance.json`, and load it in `lib/evidence/`.

If the new rows record oxygen, pressure or airflow differently from the set you are adding to, they are a new evidence set of their own. Don't normalise incompatible measurements into one column.

## Steps (evidence set)

1. **Provenance first.** Record the title, agency, URL, DOI, table and printed page, the access date (YYYY-MM-DD), the method, the verification status ("pending second-person check" until done), the licence and the limitations. Copy the shape of `data/evidence/provenance.json`. If you save NASA's own file unchanged, record its SHA-256 and name it `data/evidence/psi-<n>-<name>.csv`: `.gitattributes` keeps those bytes exact, line endings included, so the hash still matches after a clone.
2. **Schema.** Keep the source units in the CSV and normalise only in the loader. Blank means `null`, never 0. Use `;`-lists for paired arrays and document the pairing. Add the columns to `docs/planning/data-model.md`.
3. **No runtime fetch.** The app reads committed files only. If you download a file to cross-check a transcription, commit it under `data/evidence/fixtures/`, add a row to that folder's README with the date, and label it `fixture` wherever it is quoted.
4. **Loader in `lib/evidence/`.** Read through `files.mjs` (see the `compute-boundary` skill). Attach `sourceLocation` and `missing[]` to every record.
5. **Tests** in `tests/evidence/`. Reproduce at least two published values exactly. Test that missing values stay `null`. Where NASA publishes its own table, test the transcription against it.
6. **Surface it.** Add it to `NOTICE`, the README's evidence table, `docs/planning/data-model.md` and the Sources section of the Will it burn? page.
7. **Log it** in `docs/AI_USE.md` if AI helped with the transcription.

## Done when

`npm test` is green, `npm run evaluate` is 20/20, the provenance record states its verification status honestly, and the source is visible in the UI.
