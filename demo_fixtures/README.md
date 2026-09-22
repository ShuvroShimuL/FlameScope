# demo_fixtures/

These are committed on purpose. They hold the exact bytes the offline demo needs. `src/acquire/safe.mjs` reads `demo_fixtures/<key>.json` when the network and `cache/` both fail, or always when `OFFLINE=1` and the cache is empty.

| File | Produced by | Contents |
|---|---|---|
| `ntrs-20210011385.json` | `node src/acquire/ntrs.mjs` (2026-09-23) | NTRS citation record for the BASS-II Summary Report |

To add one: run the acquire module live, copy only the files the demo uses from `cache/`, add a row here, and keep each fixture small. The core BASS-II rows live in `data/`, not here, because they are source data, not a fetch result.
