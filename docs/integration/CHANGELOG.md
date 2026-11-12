# Changelog: FlameScope 2.0.0 (integration branch)

Branch `integration/flamescope-hearth`, based on FlameScope `fdce8c5` and Project-HEARTH `ccc64ac`.
Nothing here has been pushed or deployed.

## Added

- **Will it burn?** (`/burn`): questions about a solid material in a cabin, answered from NASA's BASS-II rows
  by fixed rules. Read-as chips, mission tiles that print their cabin air, cabin-air and material controls,
  thickness chips, the five verdicts, a condition-by-condition check, key numbers, a spread chart with a table
  equivalent, source rows, sourced gap cards, closest tests, a "nearest evidence" action, ranked findings,
  NASA's quoted fire-response steps, saved questions and the provenance records.
- **Markdown evidence brief** for any answer, including No data and Unclear.
- **API:** `GET /api/burn/ask`, `GET /api/burn/data`.
- **VESTA tool `will_it_burn`** (the twelfth), an Offline-mode intent for solid materials, a `burn` dashboard
  view, follow-up suggestions, and four eval questions.
- **`lib/brand.ts`**: one source for product identity, with a test that guards it.
- **Cross-site check** on `POST /api/vesta` and `POST /api/calc`; response headers on every route.
- **Focus handling** for the test drawer and the first-visit tour; a focus ring on explorer rows.
- **MCP research tools** (`npm run mcp`) and the 20-case evidence evaluation (`npm run evaluate`), carried
  over from FlameScope v1.
- `AGENTS.md`, `NOTICE`, ADR-017, and this folder.

## Changed

- **Name and mark:** HEARTH → FlameScope everywhere a user or a reader sees it; the blue FlameScope flame
  replaces the orange ring flame in the header, the tab icon and the Blueprint. Ember stays the interface accent.
- **Package:** `flamescope` 2.0.0, Apache-2.0.
- **Stored preferences** move to `flamescope.*` keys; old values carry over once.
- **Claims corrected:**
  - "No solid-material tests" now reads as true of the ACME, CFI and SPICE table only, with a pointer to the
    solid set (prompt, About, Dataset, Overview, Explorer, lab, gap finder, safety audit).
  - "Microgravity and 1g only bound lunar gravity" is gone: the data has no 1g rows.
  - The still-air rule no longer counts rows with a negative coflow, and no longer calls ventilation shutdown
    "supported".
  - "Data envelope" in VESTA's alert and Offline answers says it counts gas and droplet tests.
  - The safety rule on cabin materials states both evidence sets, with counts taken from the rows.
- **Evidence engine:**
  - a fabric answer says which rows come from the earlier BASS investigation;
  - the pressure hint suggests 101.3 kPa (101 kPa is 14.6 psi and found no data);
  - each mission tile carries its cabin air;
  - data is read through one loader from `data/evidence/`.
- **MCP `get_provenance`** reads the committed NTRS record and labels it `fixture`. It makes no network call.
- **Offline mode:** a solid-material question no longer switches the dashboard's active mission.
- **Blueprint:** counts the engine's test suites; explains the new page, routes, tool and module; adds two
  honesty rules; no longer states that a push deploys this repository.
- **Tests:** one runner (vitest) for everything.
- **Agent instructions and skills** rewritten for the unified layout.

## Removed

- FlameScope v1's HTTP server, static pages (`web/`, including the research view), Vercel entry (`api/`,
  `vercel.json`), OpenAI evidence selector and provider, runtime NASA fetch layer (`src/acquire`), and the six
  test suites that covered only those.
- v1's light theme and theme toggle, collapsible sidebar, flame illustration and keyword popover.
- HEARTH's `test.txt` and a duplicate `docs/MASTER_PROMPT.md`.
- The instruction to push and deploy on every change (archived with HEARTH's `CLAUDE.md`, not in force).

## Moved, unchanged

- `src/compute/` → `lib/evidence/`; `data/*` → `data/evidence/`; `demo_fixtures/` → `data/evidence/fixtures/`;
  `test/` (15 suites) → `tests/evidence/`.
- Both projects' root documents → `docs/legacy/flamescope-v1/` and `docs/legacy/hearth/`.

## Fixed during this work

| Problem | Found by | Fix |
|---|---|---|
| NASA's PSI files lost their byte-exact protection when moved | reading `.gitattributes` after the move | rule repointed; hashes checked |
| "101 kPa" in the engine's own hint returned No data | scientific review | hint corrected, regression test |
| Fabric answers could rest entirely on BASS rows without saying so | scientific review | study shown per row and in the caveat |
| Offline VESTA switched the active mission on a solid-material question | new test | solid questions leave the mission alone |
| My own summary sentence said Nomex samples were "burned" | re-reading it | reworded to "records … tests"; test forbids the word |
| A build made while a dev server ran returned 500 on most routes | route smoke test | rebuilt clean; documented |
| The dataset citation overflowed a 320 px screen after the rebrand | viewport matrix | the citation now wraps |
| One commit message overstated its test count by one | re-counting | message corrected before anything was pushed |

Findings from the independent review of the finished code, and what was done about each, are in
[QA_REPORT.md](QA_REPORT.md), section 7.

## Commits

```text
369ad08 Make room for the HEARTH baseline: archive the v1 root docs
f0a6591 Merge Project-HEARTH main (ccc64ac) as the application baseline
47ddd0c Retire the v1 server, static UI, AI path and fetch layer
666f58b Port the evidence engine into the HEARTH layout
ea51277 Keep NASA's PSI files byte-exact at their new path
cafd641 Rebrand the app as FlameScope with the blue flame logo
eb31f09 Evidence engine: label BASS rows, and fix the pressure hint
e6c34d5 Add Will it burn?: page, API, Markdown brief and VESTA tool
09422dc Harden requests and fix keyboard focus in the two dialogs
```

followed by the documentation and review-fix commits listed in `git log`.
