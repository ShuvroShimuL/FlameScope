---
name: offline-demo
description: Prepare and verify FlameScope's wifi-off demo — pre-fetch into cache/, copy fixtures to demo_fixtures/, run with OFFLINE=1, and walk the pre-flight checklist. Use before any demo, recording, or when an acquire module changes.
---

# Offline demo

Follow `docs/planning/offline-demo.md`. In short:

1. **Pre-fetch** every acquire module live:
   ```bash
   node src/acquire/ntrs.mjs          # add each new module here
   ```
2. **Copy the minimum set** from `cache/` to `demo_fixtures/`, and update `demo_fixtures/README.md`.
3. **Verify the fallback** with the cache hidden:
   ```bash
   mv cache cache.bak && OFFLINE=1 node src/acquire/ntrs.mjs; mv cache.bak cache   # expect source: 'fixture'
   ```
4. **Run the app offline:** `OFFLINE=1 node src/api/server.mjs`. Load `/` (Will It Burn?) and `/research/`, and click all six suggested questions. Check that the network tab shows only `127.0.0.1`.
5. **Tests:** `node --test` (includes the fixture-exists check).
6. **Report** each fixture with its source label, and anything that failed. Never say "ready" without running steps 3–5.

Don't commit `cache/`. Do commit `demo_fixtures/`.
