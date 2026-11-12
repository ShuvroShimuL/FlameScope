---
name: provenance-audit
description: Audit that every number FlameScope shows traces to a source row or cited reference, and that missing values, units and labels are honest. Use before submission, after UI/copy changes, or when asked "is this number sourced?".
---

# Provenance audit

## Procedure

1. **Inventory numbers.** Grep for digits in the rendered copy (`app/**/*.tsx`, `components/**/*.tsx`) and in the engines' strings (`lib/evidence/*.mjs`, `lib/safety.ts`, `lib/analysis.ts`, `lib/vesta/offline.ts`, `lib/vesta/system-prompt.md`). Every hit is one of:
   - (a) read from a record at runtime, which is OK,
   - (b) a cited constant (`SOURCES` / `MISSIONS` / `AIRS` in `lib/evidence/catalog.mjs`, `lib/missions.ts`, a tested formula in `lib/physics.ts`), which is OK if its source is stated,
   - (c) UI layout or scale, which is OK,
   - (d) a FlameScope heuristic (ranking, severity, hazard index, envelope thresholds), which is OK only if it is labelled as one where it appears,
   - (e) **anything else, which is a finding.**
2. **Spot-check solid rows.** Pick 3 random test IDs and call the MCP `search_evidence` tool or `/api/burn/data`. Compare against the PDF (NASA/TM-20210011385, printed p. 57) cell by cell, including `;` pairing order.
3. **Spot-check gas rows.** Pick 3 test IDs from `/api/tests` and compare with the `source_file` and `source_row` in `Pseudo_DataKeep/`.
4. **Missing values.** M6 and M12 spread must render as "Not tracked", never 0 or blank. A missing gas field must render as missing.
5. **Labels.** Simulations say DEMO; findings say "descriptive, not a safety rating"; heuristic scores say they are FlameScope heuristics; no string says "safe", "certified" or "recommended" as a claim.
6. **The two sets.** "Data envelope" and "tests nearby" must say they count gas and droplet tests. Nothing about solids may be answered from them, and no BASS-II row may appear in `data/processed/`.
7. **Verification status.** Each provenance record's "pending" status must still be visible in the Sources section of `/burn`.

## Output

A table with columns number · location · category (a–e) · source · verdict. List the findings first. Don't fix copy silently. Report it, then propose a fix.
