# Branding audit

**Product:** FlameScope · **Assistant:** VESTA · **Team:** Team Polaris

## 1. One source

`lib/brand.ts` holds the product name and slug, tagline and description, team, event and challenge wording, the
disclaimer, the assistant's name and expansion, repository links, the export file prefix, browser storage keys
and the logo's path, geometry and colours. `tests/brand.test.ts` fails if the earlier name, repository or
deployment address appears anywhere in `app/`, `components/`, `lib/` or the Blueprint sources outside that file.

## 2. The logo

### What "the original FlameScope blue fire logo" is

FlameScope v1 has exactly one flame mark: an inline SVG path in `web/index.html` (24 × 24 box), introduced in
commit `c1bce11`. No logo file, ICO or SVG asset exists anywhere in the repository or its history. The slides and
concept film use an orange Polaris star, and the v1 research view used a `◈` glyph.

That flame has had two treatments:

| Treatment | Where | When |
|---|---|---|
| white flame on an orange gradient tile | `web/style.css:80-81`, and the favicon | from `c1bce11` |
| **blue flame on a blue-tinted tile with a 1px blue border** | `web/workspace.css:47-48` | from `96eb2b7`, the themed workspace of 2026-10-10 |

A visitor to v1 sees the blue one: `web/theme.js` always sets `data-theme`, so the workspace rule wins. The
orange tile appears only with scripts blocked.

**So the blue flame is the right mark, with one thing to be straight about:** it is the current mark, not the
first one. The same glyph was orange for its first weeks, v1's favicon was never changed from orange, and the
committed screenshots under `docs/video/` still show the orange tile. If "original" was meant literally, the
answer would be the orange tile, which is the look this integration was asked to move away from. The blue
treatment is used.

### What was used

- **Path:** unchanged from `web/index.html`.
- **Proportions:** unchanged: a 22-unit glyph centred on a 32 × 36 tile with a 3-unit corner radius and a 1px border.
- **Colours:** v1's dark-theme values, because this app is dark: flame `#8cb6ff`, tile `#1b2943`, border
  `#435e88`. v1's light-theme flame colour (`#315cac`) would have a contrast of about 2.9:1 on this app's panel.

### Variants, all derived from the same path

| Use | File | Difference from the original |
|---|---|---|
| Header | `components/ui/Logo.tsx` | none: tile and glyph as in v1 |
| Browser tab and bookmarks | `app/icon.svg` | square tile, flame enlarged to fill it. At 16 px the original's 7 × 12 px flame loses its notch and the 8:9 tile cannot stay portrait. |
| Blueprint header and its tab icon | `scripts/blueprint/template.html` | header: as in v1; tab icon: the square variant |

HEARTH's orange flame-in-a-ring is gone from all three. A test checks that the three share one path and that no
orange ring remains.

### A new lockup

v1 only ever showed the flame beside the words "Will it burn?". Beside "FlameScope" it is a new pairing. It
reads well in the header at every tested width, but it has not been through a design review.

## 3. Colour

Only the product mark is blue. The interface accent stays ember (`#ff7a2f`), for three reasons: ember is also a
data colour (heat, the active mission, VESTA); it appears in about 250 places across CSS, charts, the 3D scene and
a shader; and `#8cb6ff` is nearly indistinguishable from the ACME series colour and close to CFI's. A full recolour
was not requested and would have cost chart legibility.

The visible consequence is a blue mark above an ember line under the top bar. It reads as a deliberate two-colour
identity. If the team prefers a different balance, change `BRAND.logo.colors`.

## 4. What was renamed

| Surface | Before | After | Where |
|---|---|---|---|
| Browser title | `HEARTH · Team Polaris`, `%s · HEARTH` | `FlameScope · Team Polaris`, `%s · FlameScope` | `app/layout.tsx` |
| Metadata | description only | description, application name, author, Open Graph and Twitter text, theme colour | `app/layout.tsx` |
| Tab icon | orange ring flame | blue flame tile | `app/icon.svg` |
| Top bar | orange logo, "HEARTH" | blue logo, "FlameScope" | `components/layout/TopBar.tsx` |
| Hero | "HEARTH (Habitat Environment Analysis & Risk Tracking Hub) turns…", "Fire-safety intelligence…" | "FlameScope turns…", "Fire-safety evidence for crewed habitats" | `components/layout/HeroBand.tsx` |
| Footer | "How HEARTH works" | "How FlameScope works" | `components/layout/SiteFooter.tsx` |
| First-visit tour | "Welcome to HEARTH", dialog label | "Welcome to FlameScope" | `components/ui/Tour.tsx` |
| About page | title, eyebrow, body, limits, atmospheres heading | FlameScope | `app/about/page.tsx` |
| Dataset page | description, body, download names | FlameScope, `flamescope-*` | `app/dataset/page.tsx` |
| Downloads | `hearth-tests.json`, `hearth-split-….csv` | `flamescope-tests.json`, `flamescope-split-….csv`, `flamescope-brief-….md` | `lib/brand.ts` |
| VESTA | prompt, Offline answers, tool descriptions, safety wording | FlameScope | `lib/vesta/` |
| Provider request headers | `X-Title: HEARTH VESTA`, referer to the HEARTH repo | `FlameScope VESTA`, the FlameScope repo | `lib/vesta/providers/` |
| Source links on the Dataset page | HEARTH repository | FlameScope repository | `lib/dataset-docs.ts` |
| Reference atmosphere labels | "HEARTH reference atmospheres" | "FlameScope reference atmospheres" | `lib/missions.ts` |
| Blueprint | title, header, logo, footer links, text | FlameScope | `scripts/blueprint/` |
| Package | `hearth` 0.1.0 | `flamescope` 2.0.0, Apache-2.0 | `package.json` |
| Internal names | `useHearth`, `HearthState` | `useAppStore`, `AppState` (26 files, mechanical) | |
| Empty, loading and error states | carried no product name | unchanged | `app/error.tsx`, `app/not-found.tsx` |
| PWA manifest, Open Graph image, Apple icon | none existed | none added (see section 6) | |

## 5. What was kept on purpose

| Item | Why |
|---|---|
| **VESTA**: name, expansion, personality, levels, Engine room, all tools | Required, and nothing about it needed renaming. |
| **Team Polaris**, the Polaris star mark and the constellation backdrop | Team identity, not product identity. |
| The dataset citation's "(first released as Project HEARTH)" | Older references to the dataset must still resolve. **Please confirm this wording.** |
| NASA investigation names, document titles, citations | Sources, not branding. |
| HEARTH's commit history, including subjects that say HEARTH, shown in the Blueprint timeline | Contributor history. |
| `docs/legacy/hearth/*` and `docs/legacy/flamescope-v1/*` | Unchanged records of both projects. |
| Stored preferences | Keys are now `flamescope.*`. The old `hearth.*` values are read once and copied, so a returning visitor on the same address keeps their mission, engine, level, tour and map choices. |

## 6. Open points

1. **Links to source files** on the Dataset page and in the Blueprint now point at
   `github.com/ShuvroShimuL/FlameScope/blob/main/…`. They will not resolve until this branch is merged into `main`.
2. **The hero tagline** changed from "Fire-safety intelligence" to "Fire-safety evidence". It matches what the
   product does and avoids promising more than evidence. It is one line in `lib/brand.ts` if the team prefers the old one.
3. **No Open Graph image, Apple touch icon or web manifest** existed, and none was added. Text metadata is in
   place. An image needs a design decision.
4. **Committed screenshots and the concept film** under `docs/video/` still show the earlier "Will it burn?"
   page with the orange tile. They are presentation history and were left alone.
5. **The Blueprint page loads its fonts from Google at run time**, unlike the app, which self-hosts them.
6. **The old HEARTH deployment** still carries the old name. Nothing was changed there.
