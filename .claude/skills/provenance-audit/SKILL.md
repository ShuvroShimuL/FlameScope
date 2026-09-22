---
name: provenance-audit
description: Audit that every number FlameScope shows traces to a source row or cited reference, and that missing values, units and labels are honest. Use before submission, after UI/copy changes, or when asked "is this number sourced?".
---

# Provenance audit

## Procedure

1. **Inventory numbers.** Grep for digits in the rendered copy (`web/**/*.js`, `web/**/*.html`) and in compute outputs (`src/compute/*.mjs` strings). Every hit is one of:
   - (a) read from a record at runtime, which is OK,
   - (b) a cited constant in `SOURCES` / `MISSIONS` / `AIRS`, which is OK if the source URL resolves,
   - (c) UI layout or scale, which is OK,
   - (d) **anything else, which is a finding.**
2. **Spot-check rows.** Pick 3 random test IDs and call the MCP `search_evidence` or `/api/search`. Compare against the PDF (NASA/TM-20210011385, printed p. 57) cell by cell, including `;` pairing order.
3. **Missing values.** M6 and M12 spread must render as "not tracked", never 0 or blank-looking-zero.
4. **Labels.** Check that the flame says "Illustration", findings say "descriptive, not a safety rating", and no string says "safe", "certified" or "recommended" as a claim.
5. **Docs and impact numbers.** Every figure in `docs/planning/vision-and-scope.md`, the demo script and the project page must have a status of **verified**, with a link (ADR-007).
6. **Source badges.** Fetched values show `live`/`cache`/`fixture`.

## Output

A table with columns number · location · category (a–d) · source · verdict. List the findings first. Don't fix copy silently. Report it, then propose a fix.
