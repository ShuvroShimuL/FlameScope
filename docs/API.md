# FlameScope API

All routes are Next.js Route Handlers (Node runtime) that read `data/processed/`. GET responses are cached
for 10 minutes at the edge (`s-maxage=600`). Errors return `{ "error": "<message>" }` with status 400/404.
Every number comes from the data or from `lib/physics.ts` (tested in `tests/physics.test.ts`).

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/missions` | Reference atmospheres with pO2 and ratio to ISS |
| GET | `/api/tests` | Filter, sort and page the test table |
| GET | `/api/tests/{id}` | One test, derived values and related PDF passages |
| GET | `/api/map` | Points for the habitat relevance map (O2 vs pressure) |
| GET | `/api/rank?mission=` | Investigations ranked for a mission, with score parts |
| GET | `/api/gaps?mission=` | O2 × pressure coverage grid, gaps, recommendations |
| GET | `/api/compare?inv=` | Shared / unique attributes and condition stats |
| GET | `/api/search?q=` | PDF passages with file + page |
| POST | `/api/calc` | pO2, ratios, flow regime, envelope, hazard index, nearest tests |

## GET /api/missions

```json
{
  "missions": [
    { "id": "lunar-rover", "name": "Pressurized lunar rover (demo scenario)", "o2_pct": 34, "pressure_psi": 8.2,
      "demo": true, "po2_psi": 2.788, "ratio_to_iss": 0.903, "...": "..." }
  ],
  "source": { "file": "lib/missions.ts", "note": "FlameScope reference atmospheres (project assumptions)" }
}
```

## GET /api/tests

Query: `investigation` (comma list: ACME,CFI,SPICE) · `fuel_phase` (gas|liquid|solid) · `o2_min` · `o2_max` ·
`q` (text) · `sort` (test_id, investigation, fuel, o2_pct, pressure_psi, flow_cm_s, size_mm, key_metric_value;
prefix `-` for descending) · `page` · `page_size` (≤100) · `include_duplicates=true`.

`/api/tests?investigation=CFI&o2_max=18&page_size=1`

```json
{
  "total": 19, "page": 1, "page_size": 1, "pages": 19,
  "o2_pct": { "n": 19, "min": 17, "max": 17, "mean": 17 },
  "by_campaign": { "CFI · n-dodecane": 4, "CFI · n-dodecane/iso-dodecane": 15 },
  "o2_values": [17, 17, "..."],
  "rows": [
    { "test_id": "CFI-FLEX-1213", "investigation": "CFI", "fuel": "n-dodecane", "fuel_phase": "liquid",
      "o2_pct": 17, "pressure_psi": 14.696, "flow_cm_s": null,
      "source_file": "Pseudo_DataKeep/CFI/CFI_Experimental_Table.csv", "source_row": 8, "flags": [] }
  ]
}
```

## GET /api/tests/{id}

`/api/tests/ACME-CFIG-002`

```json
{
  "test": { "test_id": "ACME-CFIG-002", "o2_pct": 38.982, "pressure_psi": 13.697, "key_metric_name": "burn_time_s",
            "key_metric_value": 43, "source_row": 3, "extra": { "test_label": "21088 B1", "tad_k": 2713.594987 }, "...": "..." },
  "derived": {
    "po2": { "value": 5.339, "unit": "psi", "formula": "pO2 = (38.982 / 100) × 13.697 psi" },
    "ratio_to_iss": { "value": 1.73, "unit": "× ISS", "formula": "5.339 psi / 3.087 psi (ISS pO2)" },
    "flow_regime": { "regime": "unknown", "rule": "no airflow value" }
  },
  "passages": [ { "source_file": "Pseudo_DataKeep/ACME/ACME_Report.pdf", "page": 23, "snippet": "…" } ],
  "source": { "file": "Pseudo_DataKeep/ACME/ACME_Experimental_Table.csv", "row": 3 }
}
```

## GET /api/map

```json
{
  "points": [ { "test_id": "ACME-CFIG-001", "investigation": "ACME", "o2_pct": 39.39, "pressure_psi": 13.697,
                "flow_cm_s": null, "fuel": "ethane", "from_doc": false } ],
  "not_plotted": [],
  "iss_po2_psi": 3.087,
  "constant_po2_line": "o2_pct = 100 × 3.087 / pressure_psi",
  "lunar_region": { "o2_pct": [30, 34], "pressure_psi": [8.2, 10.2] }
}
```

SPICE points carry `from_doc: true` (21% / 101 kPa from SPICE_Report p20).

## GET /api/rank?mission=lunar-rover

Score 0–100 = proximity (40) + O2 coverage (20) + pressure coverage (20) + tests in envelope (20).

```json
{
  "mission": { "id": "lunar-rover", "o2_pct": 34, "pressure_psi": 8.2, "...": "..." },
  "ranking": [
    { "investigation": "ACME", "score": 94.8, "envelope_count": 28,
      "parts": [ { "name": "Proximity", "points": 34.8, "max": 40, "why": "mean of max(0, 1 − d/3) over the 5 nearest tests" }, "..." ],
      "nearest_ids": ["ACME-CFIG-128", "..."], "sources": [ { "file": "…ACME_Experimental_Table.csv", "row": 129 } ] },
    { "investigation": "CFI", "score": 30.9, "envelope_count": 0, "...": "..." },
    { "investigation": "SPICE", "score": 14.1, "envelope_count": 0, "...": "..." }
  ]
}
```

## GET /api/gaps?mission=lunar-rover

```json
{
  "o2_bins": ["10–15 %", "15–21 %", "..."], "p_bins": ["0–5 psi", "5–8 psi", "..."],
  "grid": [ { "o2_bin": "30–35 %", "p_bin": "8–11 psi", "count": 6, "by_investigation": { "ACME": 6 },
              "missions": ["lunar-base", "lunar-rover"] }, "..." ],
  "focus_cell": { "o2_bin": "30–35 %", "p_bin": "8–11 psi", "count": 6, "missions": ["lunar-base", "lunar-rover"] },
  "mission_gaps": [ { "o2_bin": "70–100 %", "p_bin": "0–5 psi", "missions": ["spacesuit"], "count": 0 } ],
  "exploration_region_gaps": ["... 13 empty cells with 21–50% O2 below 14 psi ..."],
  "missing_fuel_phases": ["solid"], "gravity_levels_tested": ["ug"],
  "recommendations": [ { "gap": "No solid-fuel / fabric tests", "suggestion": "… BASS / Saffire-type …" } ]
}
```

## GET /api/compare?inv=ACME,CFI

```json
{
  "investigations": ["ACME", "CFI"],
  "shared": { "fuel_phase": [], "diluent": ["N2"], "...": [] },
  "only": { "CFI": { "fuel_phase": ["liquid"], "...": [] }, "ACME": { "fuel_phase": ["gas"], "...": [] } },
  "conditions": [ { "investigation": "ACME", "tests": 333, "o2_pct": { "n": 333, "min": 12, "max": 85, "mean": 44.543 }, "fuels": 7, "sensor_types": 4, "...": "..." } ],
  "sources": [ { "file": "…ACME_Experimental_Table.csv", "rows": "2–334", "note": "333 rows" } ]
}
```

## GET /api/search?q=cool flame&investigation=CFI&limit=1

```json
{ "query": "cool flame", "passages": [ { "chunk_id": "CFI-Report-p5-c3", "source_file": "Pseudo_DataKeep/CFI/CFI_Report.pdf",
  "page": 5, "score": 18.28, "snippet": "…the second-stage flame is shown to lie closer to the droplet surface…" } ] }
```

## POST /api/calc

Body: `{ "o2_pct": 34, "pressure_psi": 8.2, "flow_cm_s": 10 }`

```json
{
  "po2": { "value": 2.788, "unit": "psi", "formula": "pO2 = (34 / 100) × 8.2 psi" },
  "ratio_to_iss": { "value": 0.903 }, "o2_vs_earth": { "value": 1.619, "delta_pp": 13 },
  "flow_regime": { "regime": "low", "rule": "5–20 cm/s" },
  "envelope": { "status": "supported", "count": 28, "confidence": "supported" },
  "hazard_index": { "value": 37.9, "label": "heuristic", "parts": [ "..." ] },
  "nearest": [ { "distance": 0.341, "test_id": "ACME-CFIG-128", "...": "..." } ]
}
```

## GET /api/burn/ask

Will it burn? One cabin scenario checked against NASA's BASS-II solid-material tests. The answer is computed by
fixed rules from committed rows; no model is involved. Send a question, explicit conditions, or both. Explicit
conditions win over the question.

| Parameter | Meaning |
|---|---|
| `q` | plain-English question, at most 500 characters |
| `mission` | `iss`, `moon`, `transit`, `mars`, `earth` or `other` (with `place`, and `g` in g) |
| `air` | `earth` (14.7 psi, 21% O2) or `exploration` (8.2 psi, 34% O2) |
| `o2`, `psi` | oxygen share in percent, cabin pressure in psi |
| `material` | `pmma`, `sibal`, `nomex` (tested), another catalogue id, or `other` with `materialName` |
| `thickness`, `width` | millimetres, or `all` |
| `airflow` | cm/s (0 is still air), or `none` for any tested value |

Unknown parameters, values over 500 characters and out-of-range numbers return 400 with `{ "error": "…" }`.
A question that cannot be read is not an error: it returns 200 with `verdict.state` `unresolved` and the reason.

```jsonc
// GET /api/burn/ask?q=Will acrylic burn on the ISS?
{
  "canonical": "Will acrylic burn on the ISS in Earth-normal air?",
  "understood": [{ "field": "Mission", "value": "ISS", "from": "question" }, …],
  "verdict": { "state": "burned", "stamp": "Burned", "count": "20 of 20 tests", "headline": "Yes. NASA watched it burn.", "sub": "…" },
  "checks": [{ "key": "material", "label": "Material", "yours": "Acrylic (PMMA)", "tested": "Acrylic (PMMA)", "status": "match", "ok": true, "note": null }, …],
  "evidence": { "kind": "spread", "ids": ["M1", …], "stats": { "tests": 20, "notTracked": 2, … }, "finding": { … }, "caveat": "…" },
  "closest": null, "gaps": [], "nearest": null,
  "applicability": { "policy": "A test counts only if its own row records every condition you gave, all together. …", "matched": ["M1", …] },
  "sources": [{ "name": "NASA/TM-20210011385, Table 5.1, printed p. 57 (BASS-II)", "url": "https://ntrs.nasa.gov/citations/20210011385" }]
}
```

`verdict.state` is one of `burned`, `mixed`, `no-burn` (no flame held), `no-data` or `unresolved`. The full
shape is typed as `BurnAnswer` in `lib/evidence/types.ts`.

## GET /api/burn/data

The tables behind the page, built once: `records` (the 20 acrylic rows, each with `sourceLocation` and
`missing`), `findings` (ranked, with the pairs counted and the display rule), `fireResponse` (NASA's quoted steps
with the evidence found for each), `policy` and `provenance`. Typed as `BurnData`.

## Cross-site requests

`POST /api/vesta` and `POST /api/calc` answer 403 when the `Origin` header names another host. Requests with no
`Origin` are accepted.
