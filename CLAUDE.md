# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- **Skills** live in `.claude/skills/`. Use them for the matching task:
  - `add-nasa-dataset`: adding a source or rows (provenance, fixture, tests), for either evidence set
  - `compute-boundary`: any change in `lib/evidence/`, or any change that tempts you to put science outside it
  - `provenance-audit`: checking that every on-screen number traces to a source row
  - `offline-demo`: checking the app with no keys and no network
  - `ai-use-log`: appending to `docs/AI_USE.md` after AI-assisted work
  - `demo-pitch`: editing the demo script or the project-page copy
- **MCP:** `.mcp.json` registers the `flamescope` server (`scripts/mcp-server.mjs`, read-only, no network).
  Prefer calling `will_it_burn` or `search_evidence` to check a claim about solid materials over reading the CSV by hand.
- Before claiming a task is done, run the checks in AGENTS.md and report the actual numbers.
- Don't commit or push unless asked. Don't deploy.
- `npm` works on this machine. (An earlier note here said it was broken; that is no longer true.)
- Stop any dev server before `npm run build`: a build made while one is running returns 500s.
