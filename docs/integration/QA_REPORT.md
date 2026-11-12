# QA report

Branch `integration/flamescope-hearth`, 2026-11-12. Baselines: FlameScope `fdce8c5`, Project-HEARTH `ccc64ac`.
Every result below comes from a command or a browser session that was actually run on this machine
(Windows 11, Node 24.13.1, npm 11.10.0), with no model API key set. Where something was not run, it says so.

## Verdict: READY WITH CONDITIONS

The unified app builds, passes every automated check, and behaved correctly in a real browser at every
requested size. It is fit for a local demonstration and for team review today. It is **not** ready to be
published on a public host until the conditions in section 9 are met. The two that matter most: the framework
version carries known security advisories that only a major upgrade fixes, and the licence of the code that
came from HEARTH is not settled. Nothing was pushed or deployed.

## 1. Engineering checks

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | exit 0 |
| Lint | `npm run lint` | no warnings or errors |
| Tests | `npm test` | **34 files, 353 tests, all passed** |
| Evidence evaluation | `npm run evaluate` | 20/20; also 20/20 when started from another folder |
| Production build | `npm run build` | exit 0; 32 static pages generated; 28 routes |
| Route smoke test | `curl` against `next start` | 16 of 16 pages and routes returned 200; bad requests 400; unknown paths 404 |
| VESTA Offline evals | `scripts/run-evals.ts --engines offline` against the production build | **16 of 16** (12 existing, 4 new solid-material questions) |
| Data integrity | blob comparison with `fdce8c5` | 9 data and fixture files are the same blobs; only path strings changed in 5 provenance files; PSI-99's SHA-256 matches its record |
| Secrets | pattern scan of tracked files; scan of the built client bundle | none found; no key name and no file-reading code in the browser bundle |
| Dependency audit | `npm audit --omit=dev` | **3 findings: `next` (critical), `postcss` and `zod` (high).** See section 9. |

For comparison, pristine HEARTH: 14 files, 185 tests. The 168 additional tests are the engine's suites
(16 files: 15 ported, plus one for the brief) and four new files for the routes, the VESTA tool, branding
and security.

Two mistakes of mine were caught by these checks and are fixed: a build made while a dev server was still
running produced a site that returned 500 on most routes (rebuilt clean), and the rebrand made the Dataset page
15 px wider than a 320 px screen (the citation now wraps).

## 2. Scientific correctness

| Check | How it was checked | Result |
|---|---|---|
| Source and row citations | every acrylic row carries `Table 5.1, printed p. 57, row Mn`; fabric and Nomex rows their table, page and test; route and brief tests assert them | pass |
| Transcription against NASA's own file | the 40 acrylic oxygen values and the Nomex oxygen values against NASA's PSI-25 table (committed fixture) | pass; the other columns still await an independent check |
| Unit conversions | the engine's reader tests (psi, kPa, atm, bar, mmHg; mm, cm, in; cm/s and others); `tests/physics.test.ts` for pO2 and ratios | pass |
| Missing values | M6 and M12 spread "Not tracked", Nomex F3 final oxygen "not read", pressure "Not recorded"; checked in tests, the brief and the browser | never 0, never blank |
| Abstention | Moon base, exploration air, untested materials, conditions no single row records, unreadable questions, unknown vehicles | No data or Unclear, with sourced gaps; never a prediction |
| Same-row matching | route test: 1 mm with 10 cm/s matches only rows that record both; oxygen with airflow never matches (the table cannot tie them) | pass |
| Confidence labels | solid answers: 5 or more matching rows supported, 1 to 4 extrapolated, 0 no_data; an AI-engine test shows a model cannot claim more | pass |
| No ungrounded numbers | Offline answers and the brief are tested to contain no number that is not in the engine's answer, the cited rows or the question | pass |
| Observation, not prediction | every solid verdict is worded as what was observed; "not a safety rating" is asserted in tests and evals | pass |
| The two evidence sets stay apart | a test asserts no solid row is in the gas and droplet table, and that table still has no solid rows | pass |

## 3. VESTA

| Check | Evidence | Result |
|---|---|---|
| Offline mode | 16 of 16 evals against the production build; browser run below | pass |
| Provider fallback with mocked failures | HEARTH's existing suites (`tests/vesta.test.ts`, `tests/hardening.test.ts`): missing key, 401, 404, 429, 5xx, timeout, bad tool calls, all ending in an answer | pass (unchanged) |
| Tool execution | `tests/tools.test.ts`, `tests/will-it-burn.test.ts` (20 + 12 tests) | pass |
| Chart generation | existing `make_chart` tests | pass (unchanged) |
| Navigation | browser: asking VESTA "Will acrylic burn on the ISS?" opened `/burn` with the same question and the same verdict; the active mission did not change | pass |
| Unsupported questions | spacesuit, rover, Orion, over-long questions, gas fuels asked with "burn" | Unclear, a request to shorten, or left to the gas tools |
| Source citation | the solid answer's chip read "BASS-II report TM-20210011385, Table 5.1 · p57" with the matching test IDs | pass |
| No key exposure | `/api/vesta/engines` returned only `id`, `label`, `available`; bundle scan | pass |
| **AI engines on solid questions** | **not run.** No key was set at any point. A scripted fake model exercised the code path. | not evaluated |

## 4. Browser checks

**Chromium 157**, driven through DevTools automation against the production build.

| Viewport | Pages checked | Horizontal overflow | Clipped controls | Page errors |
|---|---|---|---|---|
| 2560 × 1440 | all 9 | none | none | none |
| 1920 × 1080 | all 9 | none | none | none |
| 1366 × 768 | all 9 | none | none | none |
| 1024 × 768 | all 9 | none | none | none |
| 768 × 1024 (touch) | all 9 | none | none | none |
| 390 × 844 (mobile, touch) | all 9 | none | none | none |
| 375 × 812 (mobile, touch) | all 9 | none | none | none |
| 320 × 568 (mobile, touch) | all 9 | `/dataset` 15 px, **fixed and re-checked: none** | none | none |

One benign "ResizeObserver loop" notice appeared on the overview page when the viewport changed; it comes from
the baseline's chart resizing.

| Interaction | Result |
|---|---|
| Will it burn?: mission tile, nearest evidence, material buttons, typed questions, empty question, a question containing HTML | each produced the expected verdict; the HTML was shown as text and ran nothing |
| Chart | rendered (671 × 300 at tablet width) with a text label; the same values are in the table below it |
| Saved questions | 8 stored after 8 questions; each entry holds only `id`, `question`, `params`, `savedAt` |
| First-visit tour | Tab stayed inside the dialog; Escape closed it |
| Test drawer | opened from the keyboard, Shift+Tab stayed inside, Escape closed it and returned focus to the row; page scroll restored |
| Lighthouse (snapshot) on `/burn` and `/` | Accessibility 100, Best Practices 100, SEO 100 on both |
| After the review fixes | tile notes, unrounded burn minutes, the new chart caption and the licence lines are present; no overflow at 320 px on 5 pages |

**Firefox 144**, headless, one screenshot at page load for four pages: the shell, logo, navigation and VESTA panel
rendered correctly. This is a first-paint check only. No interaction, viewport matrix or console check was done
in Firefox.

**Not run:** WebKit or Safari (not available on this machine). Reduced-motion emulation (the automation tool does
not offer it; the CSS rules and the tour's scrolling were reviewed in code only). A light theme (the app has
none). Manual colour-contrast measurement (only Lighthouse's automated check, on two pages). Real touch devices.
The "Not answered" state after a network failure (code and unit tests only).

Screenshots are in [screenshots/](screenshots/).

## 5. Security

- **Added:** cross-site POSTs to `/api/vesta` and `/api/calc` are refused (403, confirmed with `curl`); every
  response carries `nosniff`, `X-Frame-Options: DENY`, a CSP of `frame-ancestors 'none'; base-uri 'self';
  form-action 'self'; object-src 'none'`, a referrer policy and a permissions policy (confirmed on a page and an
  API route); the eval token is compared in constant time.
- **Checked:** unknown or oversized parameters on `/api/burn/ask` are 400s; `?air=constructor` is a 400; 3,000
  random and 40 targeted 500-character questions peaked at 17 ms in the engine (no catastrophic regex); the
  exported brief cannot be given a forged section or a live link by a question.
- **Not fixed:** see section 9.

## 6. Independent reviews

Six read-only reviews by separate agents. Four before the work (architecture, scientific data, UI and
branding, QA and security) shaped the plan; two after it examined the finished code and were told to look for
regressions, not to agree.

## 7. What the two reviews of the finished work found

**Code review:** no critical or high findings; six confirmed medium, seven low.
**Scientific claims review:** three high, nine medium, three low.

| Finding | Severity | Disposition |
|---|---|---|
| Unknown places (spacesuit, rover, Orion) and "pure oxygen" silently became the ISS in normal air | high | fixed; tests added |
| "Supported" on one-row and "No flame held" answers | high | fixed: the app's 5-row threshold now applies |
| "In the station's own air at 16.4–22.2% O2" | high | fixed: per-set ranges, "glovebox", BASS rows counted |
| Offline mode cut a long question, losing a stated condition | medium | fixed |
| Tool results could exceed the agent's size limit and lose fields | medium | fixed; tested over 151 questions |
| A model-opened Will it burn? page could show a different verdict | medium | fixed |
| "paper", "foam", "fabric" captured unrelated questions; "Will steel burn" was missed | medium | fixed |
| Markdown injection into the exported brief | medium | fixed |
| Engine failed when started from another folder | medium | fixed |
| Gas and droplet counts unlabelled on four pages | medium | fixed |
| Same mission name, two atmospheres | medium | mitigated (each tile states its air and where it comes from); a single catalogue is deferred |
| "Every condition you gave" overstated the rule | medium | fixed in the page copy |
| Uncertain oxygen readings used as exact matches | medium | disclosed in the answer; matching unchanged |
| pO2 range assumes 1 atm | medium | fixed in the wording |
| "No AI writes any of it" while tables were AI-transcribed | medium | fixed: stated with each record's pending check |
| Chart lines in airflow order | medium | caption fixed |
| Prototype-chain names accepted as a cabin air | low | fixed |
| Rounded burn minutes, tool wording, a garbled provenance sentence, stale comments, a sample file | low | fixed |
| `crossSite` behind a Host-rewriting proxy | low | fixed (`X-Forwarded-Host`) |
| Tour focus is not returned on close | low | not fixed: the tour cannot be reopened |
| "0 of 20 tests match" for a material with no tests | low | not fixed: the engine shows untested materials against the acrylic set |
| Test names that claimed more than they checked | — | three renamed or tightened |

**Test cases dropped in the port.** The six suites for the retired v1 server, UI, AI selector and fetch layer
have no replacement, by design. Two page-level cases ("opens neutral, not with a verdict"; "a slow table load
never overwrites a reopened question") have no equivalent for the new React page: its request ordering is
tested, its component is not.

## 8. Limitations

**Scientific, inherited from the baseline and not changed here**

1. The gas "envelope" counts rows whose oxygen is not cabin oxygen: ACME inverse flames record the burner
   stream, and the six rows that make Moon-base air "supported" are all of that kind.
2. 435 of the 518 rows near ISS conditions are SPICE rows whose oxygen and pressure are documented, not measured.
3. The envelope counts a row whatever happened in it, and shows a green status for lunar-gravity missions.
4. The flame simulator decides "burns" from the existence of nearby rows, and plays a cool flame for every CFI setting.
5. The 0–100 hazard, severity and ranking scores are heuristics. They are labelled, but several thresholds have no source.
6. The mission atmospheres are project assumptions with no cited source.
7. VESTA's AI engines write prose. Their numbers are checked; their reasoning is not, and an answer that fails
   the check is still shown, with a warning.

**Scientific, in the ported engine**

8. Solid evidence is 46 tests of three materials, in microgravity, in a glovebox whose oxygen ran from about
   16% to 22%. It says nothing about enriched oxygen, reduced pressure, partial gravity, foams or wiring.
9. Pressure is in no table. A cabin at 14.7 psi passes the pressure check as "not recorded", not as measured.
10. Acrylic oxygen is matched against each test's start-to-end span, so "at 17%" matches a test that passed through 17%.
11. The fabric, Nomex and extinction tables and the fire-response quotes were transcribed and checked with AI
    assistance only. A second-person check is pending, and the page and the brief say so.

**Technical**

12. No continuous integration, no committed browser tests, no error monitoring.
13. The rate limiter lives in one process's memory. On a serverless host it does not limit globally.
14. The cross-site check does not stop DNS rebinding. v1's Host allow-list was not carried over.
15. No script or style Content-Security-Policy: the framework's inline scripts make one a larger change.
16. `npm run build` rewrites the tracked `public/blueprint.html` after every new commit, and needs network access for fonts.
17. The React page component has no unit tests; it was checked in the browser.

## 9. Conditions before any public deployment

1. **Upgrade Next.js.** `npm audit` lists `next` 14.2.35 as critical, with advisories that include denial of
   service and remote code execution in the image optimiser and server actions, and offers only a major
   upgrade (to 16.x), which also clears the `postcss` finding. This app uses no `next/image`, server actions,
   middleware or rewrites, and its image endpoint refused a request (400), which narrows the exposure but does
   not remove it. I did not attempt the upgrade: it is a framework migration that needs its own review. The
   pristine HEARTH baseline has the same three findings, so the current HEARTH deployment is affected too.
2. **Upgrade or bound `zod`** (high: memory exhaustion on oversized collections). Request bodies have no byte
   cap ahead of validation; adding one is small and would also blunt this.
3. **Settle the licence** of the code that came from HEARTH (see REPOSITORY_AUDIT, section 5).
4. **Decide the hosting change deliberately.** If `main` is connected to a Vercel project, merging replaces the
   current site. Set only the keys meant to be live; never `FREELLMAPI_*` or `VESTA_EVAL_TOKEN`.
5. **Have a person review** the science wording, the logo choice, the dataset citation and this report. No
   human has verified any of it yet.
6. **Test with a real model key** before enabling any AI engine in public: the solid-material path has only
   been exercised with a scripted model.

## 10. Not verified

- Anything in Firefox beyond first paint; anything in WebKit; reduced motion; real devices.
- The BASS-II tables against the PDF page images; every quoted passage against its source document.
- How the glovebox oxygen was set (the report was not available offline); the wording avoids claiming it.
- The state of either Vercel project. Nothing was linked, queried or deployed.
- Whether the versions `npm audit` proposes are compatible with this app.
