# Roadmap

Dates are in 2026. The full challenge statement lands **28 Oct**, and the hackathon date is set by the local event. Fill it in below once it is announced.

| Milestone | Date | Gate |
|---|---|---|
| M0 · Structure and docs | 23 Sep ✅ | This folder, the `src/` layout, CLAUDE/AGENTS, MCP |
| M1 · Statement check | 28 Oct | Re-read the full statement. Update [vision-and-scope](vision-and-scope.md) and [requirements](requirements.md). |
| M2 · Hackathon build | _TBD_ | R1–R4 done |
| M3 · Submission | _TBD_ | Every item in the [scorecard](scorecard.md) is ✅, and the demo is recorded offline |

## Now → M1 (preparation)

| # | Work | Owner | Score line it moves |
|---|---|---|---|
| P1 | Verify the Bangladesh numbers (FSCD, primary reporting) and mark them verified | _name_ | Impact |
| P2 | Run the reviewer protocol: PDF visual check of all 20 rows by a second person | _name_ | Validity |
| P3 | Three-person usability session (5 min, no guidance) | _name_ | UX, Validity |
| P4 | Rehearse the 240 s script ([demo-script.md](demo-script.md)) with wifi off | all | Presentation |
| P5 | Assign roles below. Everyone commits under their own name. | all | Teamwork |

## Hackathon backlog (priority order)

| # | Item | Why | Size |
|---|---|---|---|
| R1 | **Source badges** (`live`/`cache`/`fixture`) next to every fetched value, and an OFFLINE banner | FR-12. Judges read the badges as rigour. | S |
| R2 | **Provenance drawer** on both views: source, page, method, verification status, limitations | FR-13, the Validity argument | S |
| R3 | **Bangladesh panel**: `src/acquire/firms.mjs` (NASA FIRMS VIIRS active fires over Bangladesh, via `safe.mjs` with a fixture) plus the verified FSCD numbers. It uses the same "does the evidence cover your conditions?" framing. | Impact, NASA + another agency | M |
| R4 | **Static export** (`scripts/export-static.mjs`): pre-compute `/api/ask` for the suggested questions and every mission × air combination to JSON, so the demo works from any static host | Offline net step 4, repo access | M |
| R5 | **Orchestrator "research mode"** over MCP tools ([agentic-design](agentic-design.md) §3) | Creativity | M |
| R6 | Transcribe a second evidence set: more BASS-II tables first, then Saffire IV–VI ([datasets.md](datasets.md) §5). Saffire VI reached about 8 psi and 29–31% O₂, so a 34% O₂ cabin stays a gap. | Relevance, Impact | L |
| R7 | Live-AI eval run (≥ 18/20), logged in `docs/AI_USE.md` | Validity | S |
| R8 | Put the challenge name and team roles in the UI footer | Category point, Teamwork | XS |

S = under 2 h, M = half a day, L = more than a day.

## Team roles (fill in)

| Role | Person | Owns |
|---|---|---|
| Data and provenance lead | | `data/`, `src/acquire/`, reviewer protocol |
| Compute and tests | | `src/compute/`, `test/`, eval |
| Frontend and UX | | `web/`, usability session |
| Agents and MCP | | `src/agents/`, AI_USE.md |
| Story and demo | | demo script, video, project page |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Full statement shifts scope away from dashboards | Medium | Re-plan at M1. The compute core and provenance carry over. |
| Venue wifi fails | High | `OFFLINE=1`, fixtures, a recorded video |
| Bangladesh numbers can't be verified | Medium | Show fewer numbers. Never show an unverified one. |
| A judge reads "No data" as "the app doesn't work" | Medium | Script line: "A gap is an answer." Nearest-evidence jump right after. |
| One member does all the commits | Medium | Roles table, small PRs per person |
