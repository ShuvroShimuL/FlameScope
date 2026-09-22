---
name: ai-use-log
description: Append an honest entry to docs/AI_USE.md after AI-assisted work (tool, model, task, key prompt, what humans verified). Use at the end of any session where an AI tool wrote code, docs or data for this repo.
---

# AI use log

Space Apps requires disclosure of every AI tool, the prompts, and the team's own work.

1. Open `docs/AI_USE.md`, section **2. AI used to build the project**.
2. Append **one row**. Never rewrite earlier rows.
   - **Date:** absolute (YYYY-MM-DD)
   - **Tool:** product plus model (for example "Claude Code (Claude Opus 5.5)")
   - **Task:** the files and features touched, specifically
   - **Key prompt:** the user's request, verbatim or closely summarised
   - **Human verification:** what was actually run or checked (test counts with numbers). Write "not yet reviewed" if nobody has checked it.
3. If the product's AI behaviour changed (model, prompt, schema), update section **1** with the new verbatim prompt.
4. Never claim human verification that didn't happen.
