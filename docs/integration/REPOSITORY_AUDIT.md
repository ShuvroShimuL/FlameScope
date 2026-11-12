# Repository audit

Audit of the two Team Polaris repositories before they were unified, carried out on 2026-11-12. Everything
here was checked against the code, the data and running commands, not against either README.

Companion documents: [FEATURE_PARITY.md](FEATURE_PARITY.md) · [MIGRATION_PLAN.md](MIGRATION_PLAN.md) ·
[BRANDING_AUDIT.md](BRANDING_AUDIT.md) · [QA_REPORT.md](QA_REPORT.md) · [CHANGELOG.md](CHANGELOG.md)

## 1. Baseline commits

| | FlameScope (delivery repository) | Project-HEARTH (implementation baseline) |
|---|---|---|
| Remote | `github.com/ShuvroShimuL/FlameScope` | `github.com/mail6heatler/Project-HEARTH` |
| Local source | `C:\GitHub\FlameScope` | `C:\Users\HP\Downloads\Project-HEARTH-main.zip` |
| Baseline commit | `fdce8c5` on local branch `will-it-burn` | `ccc64acb899055d0d205a7c91d563a88c931ced0` on `main` |
| Remote state | `origin/main` is `5370d50`; `origin/will-it-burn` no longer exists, so `fdce8c5` is **local only and unpushed** | `main` and one open pull request ref |
| Commits | 25 (authors: ShuvroShimuL 13, Shamimul Shimul 11, one other 1) | 20 (authors: "myself" 18, mail6heatler 2) |
| Working tree | clean, no stashes, one worktree | not a checkout: a zip with no `.git` |
| Licence | Apache-2.0 (`LICENSE`) | **none** |

The zip was verified, not assumed: its end-of-archive comment carries `ccc64ac…`, `git ls-remote` reports
the same SHA for `main`, and all 209 files hash to the same git blobs as that commit's tree (209 of 209).
The two histories share no ancestor.

`Pseudo_DataKeep/{ACME,CFI,SPICE}/` (nine NASA files) exists in both repositories and is blob-identical.
FlameScope tracked those files but no FlameScope code read them.

## 2. What each repository actually is

| | FlameScope v1 | HEARTH |
|---|---|---|
| Runtime | Node 22, **zero npm dependencies**, one `node:http` server | Next.js 14.2.35 App Router, React 18, TypeScript strict, Tailwind |
| Dependencies | none | 13 runtime, 12 dev; 587 lockfile entries |
| UI | static `web/` (two pages), CSP `default-src 'self'`, light and dark themes | 8 pages, a persistent VESTA panel, dark only |
| Data | 20 acrylic rows, 31 fabric rows, 3 Nomex rows and 2 extinction rows transcribed from NASA/TM-20210011385; NASA's PSI-69 (FLEX) and PSI-99 (Saffire-II) tables; 8 quoted fire-response steps | 889 rows from NASA PSI investigations ACME, CFI and SPICE, cleaned by a Python script; 3 PDFs chunked for search |
| Science | rule-based question reader and same-row matching (ADR-012); five verdicts; no score of any kind | proximity "envelope", ranking, severity and hazard heuristics with published formulas |
| AI | optional OpenAI call that may only select row IDs | VESTA: a tool-using agent over 6 model providers plus a rule-based Offline mode, with a number-grounding check |
| Tests | `node --test`, 21 suites | vitest, 14 suites |
| Hosting | `vercel.json` + `api/index.mjs`; a deployment at `flame-scope.vercel.app` is mentioned in `docs/AI_USE.md` | Vercel project `project-hearth-five.vercel.app`, deployed from `main` on every push |

### Verified baseline behaviour of HEARTH

Run on a pristine copy of the zip, with no API keys in the environment:

| Check | Command | Result |
|---|---|---|
| Install | `npm ci --ignore-scripts` | 486 packages, exit 0 |
| Types | `tsc --noEmit` | exit 0 |
| Lint | `next lint` | no warnings or errors |
| Tests | `vitest run` | 14 files, **185 tests passed** |
| Build | `npm run build` | exit 0, 25 routes |

HEARTH's README says "145+ vitest tests"; the real number is 185. FlameScope's README gives two different
test counts (112 and 102) in two places.

## 3. Instructions that are obsolete or contradict each other

| Where | What it says | Status |
|---|---|---|
| FlameScope `CLAUDE.md` | "On this machine `npm` is broken, so use the direct `node …` commands." | **No longer true.** `npm -v` returns 11.10.0 and `npm ci` installed 486 packages. |
| FlameScope `AGENTS.md` | "Zero npm dependencies." | True of v1, false of the unified app, which is a Next.js project. Superseded by ADR-017. |
| FlameScope `AGENTS.md` rule 6 | CSP stays `default-src 'self'`, no inline scripts or styles | Cannot hold in the App Router, which ships inline scripts, and the components use inline styles. Replaced by a narrower header set (see QA report). |
| FlameScope `AGENTS.md` rule 1 | An LLM never writes a claim, number or verdict that reaches the user | Holds for the evidence engine and its page. Does **not** hold for VESTA's AI engines, which write prose that a grounding check then verifies. See section 6. |
| HEARTH `CLAUDE.md` | "Start: run `git pull`", "`git push origin main`", "Deploy: push to `main` … or `npx vercel --prod`", "add every key … to Vercel" | Out of scope and unsafe for this work. Not followed. Archived unchanged under `docs/legacy/hearth/`. |
| HEARTH `CLAUDE.md` | "Deadline: 2026-11-10" | In the past. |
| HEARTH `CLAUDE.md` and prompt | "There are NO solid-material … tests"; "Microgravity results only bound lunar and Martian conditions" | The first is false for the unified product; the second was never supported (the data has no 1g rows). Both corrected. |
| Both READMEs | Test counts, feature lists | Replaced by one README with counts taken from runs. |

The four files that carried these instructions are kept, unchanged, as records:
`docs/legacy/flamescope-v1/{README,AGENTS,CLAUDE}.md` and `docs/legacy/hearth/{README,CLAUDE,MASTER_PROMPT,PROGRESS}.md`.

## 4. Claude Code environment

- **Startup hook error:** none appeared in this session, and `~/.claude/settings.json` defines no hooks of its
  own. The only hook activity came from the `ecc` plugin's GateGuard, a `PreToolUse` gate that refuses the first
  write to each new path, and commands it classes as destructive, until the purpose is stated. It refused 17
  writes and several shell commands once each; every one succeeded on retry. It slowed the work and did not
  change any result. It also flagged two read-only process queries as destructive, which is a false positive.
- **Skills:** six project skills in `.claude/skills/`. All six described the v1 layout (`src/compute`, `web/`,
  `demo_fixtures/`, `node --test`). They are updated to the new layout in this branch.
- **MCP:** `.mcp.json` registers the `flamescope` server. It now points at `scripts/mcp-server.mjs`.
- **Worktrees:** `C:\GitHub\FlameScope` (`will-it-burn`, untouched) and `C:\GitHub\FlameScope-Integration`
  (`integration/flamescope-hearth`), created for this work.

## 5. Licences, data permissions and attribution

| Item | What is recorded | Open point |
|---|---|---|
| FlameScope code | Apache-2.0 | none |
| HEARTH code | no licence file anywhere in the repository | **The HEARTH authors must confirm release under Apache-2.0.** Until they do, the unified repository's licence does not clearly cover the merged files. This is a condition on readiness. |
| NASA PSI tables: PSI-25 (BASS-II), PSI-69 (FLEX), PSI-99 (Saffire-II) | CC0-1.0, recorded in each provenance file with DOI and access date | none |
| NASA PSI files for ACME, CFI and SPICE (`Pseudo_DataKeep/`) | `data/processed/sources.json` records SHA-256, size and page count only | No PSI identifier, DOI, access date or licence is recorded for these nine files. An earlier AI-assisted review in the FlameScope repo names PSI-159, PSI-39 and PSI-107 as CC0; that is unverified. |
| BASS-II report NASA/TM-20210011385 | cited with URL, table and printed page per row | A NASA technical memorandum; reuse terms are not recorded in the repo. |
| Quoted passages: NASA OCHMO-TB-008, ICES papers on Saffire, a 2020 NASA paper | quoted word for word with source and location in `data/evidence/fire-response.json` | Short quotations with attribution; no reuse terms recorded. |
| Third-party journals: *Scientific Reports* (2018), *Fire Safety Journal* (2024) | cited by title and URL; findings are paraphrased, not copied | none beyond citation |
| Fonts | Chakra Petch, IBM Plex Sans and Mono through `next/font/google`, self-hosted at build time | The build needs network access to Google Fonts. The Blueprint page loads the same fonts from Google at run time. |

`NOTICE` at the repository root lists these attributions.

## 6. Two rulebooks

The two projects made different promises about evidence. Both survive, each inside its own boundary, and
[ADR-017](../planning/decisions.md) records the decision.

| | Gas and droplet tests (from HEARTH) | Solid materials (from FlameScope) |
|---|---|---|
| Data | ACME, CFI, SPICE: `data/processed/tests.json` | BASS-II report tables: `data/evidence/` |
| "Is this condition covered?" | at least 5 tests within ±5 points of O2 and ±2.5 psi | one row must record every given condition, with no tolerance |
| Scores | ranking, severity and hazard heuristics, labelled as such | none |
| Who writes the answer | VESTA: a model writes prose, a check verifies its numbers; or Offline templates | fixed rules; a model may only pass the answer on |
| Missing input | filled from the active mission | shown as a default, or refused as unclear; never borrowed |

They are never pooled. `tests/burn-api.test.ts` asserts that no solid row is in the gas and droplet table.

## 7. Security posture before integration

- No secret is committed in either tree. The only key-shaped strings are fake values in a HEARTH test.
- HEARTH lockfile: every entry resolves to `registry.npmjs.org` with an integrity hash; five packages have
  install scripts (`@google/genai`, `protobufjs`, two `esbuild`, `fsevents`). Dependencies were installed
  with scripts disabled.
- HEARTH had no response security headers, no cross-site check on its POST routes, and a rate limiter held in
  one process's memory. The first two are addressed in this branch; the third is recorded as a limit.
- FlameScope v1 had a Host allow-list, an Origin check on POST, a strict CSP and a 20 kB body cap. The Origin
  check is carried over. The Host list and the strict CSP are not (see the QA report for why).

## 8. Things this audit could not establish

- Whether `fdce8c5` was meant to be pushed. It exists only in the local repository.
- Who "myself" (18 of HEARTH's 20 commits) is, and therefore whose agreement the licence question needs.
- The current state of either Vercel project, its environment variables or its Git connection. Nothing was
  deployed, linked or queried.
- The transcription of the BASS-II tables against the PDF page images. The 40 acrylic oxygen values and the
  Nomex oxygen values are checked against NASA's own PSI-25 table by tests; the other columns still carry
  "independent check pending" in their provenance records.
