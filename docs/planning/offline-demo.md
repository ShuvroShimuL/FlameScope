# Offline demo safety net

This follows the brief's five steps and records where each one lives in this repo.

| # | Step | Where | Status |
|---|---|---|---|
| 1 | Pre-fetch every demo input into `cache/`, then copy the minimum set into `demo_fixtures/` | `node src/acquire/ntrs.mjs`, then copy `cache/ntrs-20210011385.json` → `demo_fixtures/` | ✅ NTRS. Repeat for each new acquire module. |
| 2 | Wrap every fetch: live, then cache, then fixture | `src/acquire/safe.mjs` → `fetchJson()` and `fetchText()` return `{data, source}` | ✅ |
| 3 | `OFFLINE=1` forces fixture mode | `safe.mjs` skips the network, and the server disables the AI step | ✅ |
| 4 | Pre-render tiles to PMTiles and pre-compute charts to static JSON | No map tiles are used. The core data is committed, and charts are drawn from it locally. Static JSON export is [roadmap](roadmap.md) R4. | 🟡 |
| 5 | Rehearse and record the 240 s demo with wifi off | [demo-script.md](demo-script.md) | ⬜ |

## Run offline

```powershell
$env:OFFLINE = "1"; node src/api/server.mjs
```

```bash
OFFLINE=1 node src/api/server.mjs
```

## Pre-flight checklist (day of demo)

- [ ] `node --test` is green
- [ ] Wifi **off**, then start with `OFFLINE=1`. Load `/` (Will It Burn?) and `/research/`, and run all six suggested questions.
- [ ] Every fetched value shows a `cache` or `fixture` badge (after R1)
- [ ] The AI checkbox shows "Offline mode…", not an error
- [ ] Browser zoom at 125%, notifications off, other tabs closed
- [ ] The backup recording is on a USB stick **and** in the cloud

## Why the badge matters

> Show the returned source label in the interface. A small "cache" badge next to a number is honest, and judges read it as rigour rather than as a failure. (from the brief)
