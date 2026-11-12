# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- **Skills** live in `.claude/skills/`. Use them for the matching task:
  - `add-nasa-dataset`: adding a source or rows (acquire module, fixture, provenance, tests)
  - `compute-boundary`: any change in `src/compute/`, or any change that tempts you to put logic outside it
  - `provenance-audit`: checking that every on-screen number traces to a source row
  - `offline-demo`: pre-fetching fixtures and running the wifi-off pre-flight
  - `ai-use-log`: appending to `docs/AI_USE.md` after AI-assisted work
  - `demo-pitch`: editing the 240 s script or the project-page copy
- **MCP:** `.mcp.json` registers the `flamescope` server (read-only tools over `src/compute`, `OFFLINE=1`). Prefer calling `will_it_burn` or `search_evidence` to check a claim over reading the CSV by hand.
- Before claiming a task is done, run `node --test` and `node scripts/evaluate.mjs` and report the actual numbers.
- Don't commit or push unless asked. The working branch is `will-it-burn`.
- On this machine `npm` is broken, so use the direct `node …` commands.
