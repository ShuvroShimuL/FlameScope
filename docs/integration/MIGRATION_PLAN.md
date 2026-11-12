# Migration plan

How the two repositories became one, why it was done this way, and what is left to do before the result
replaces `main`.

## 1. Decisions

1. **HEARTH is the application; FlameScope is the repository.** HEARTH's Next.js app sits at the repository root.
   FlameScope's deterministic evidence engine becomes a library inside it.
2. **Both histories are kept.** HEARTH's 20 commits were fetched from its remote and merged with
   `--allow-unrelated-histories`. Nothing was squashed, and no nested repository or submodule exists.
3. **One application root.** The v1 server, static pages, Vercel entry, AI path and fetch layer are deleted
   from the tree. They remain in history at `fdce8c5`.
4. **The engine's rules are not rewritten.** Its roughly 1,230 lines of rule code moved as they were, behind
   typed front doors. A TypeScript rewrite was considered and declined: the code is dense, its tests are the only
   oracle, and a rewrite would risk exactly the behaviour worth keeping.
5. **Two evidence sets, never pooled.** See [ADR-017](../planning/decisions.md).
6. **Nothing is pushed or deployed.** All work is on the local branch `integration/flamescope-hearth` in the
   worktree `C:\GitHub\FlameScope-Integration`.

## 2. What was done, commit by commit

| Commit | Step | Why it is its own commit |
|---|---|---|
| `369ad08` | Archive v1's `README`, `AGENTS` and `CLAUDE` under `docs/legacy/flamescope-v1/`; remove v1's `package.json`, `.env.example`, `.gitignore` | Five root files exist in both projects. Clearing them first lets the merge land with no conflicts, so the merge commit changes no HEARTH file. |
| `f0a6591` | Merge `hearth/main` (`ccc64ac`) | Pure merge. Verified beforehand: the handed-over zip is byte-identical to this commit. |
| `47ddd0c` | Delete the v1 server, static UI, Vercel entry, AI path, fetch layer and their six test suites | Removes the second application root before anything depends on the new layout. |
| `666f58b` | Move the engine, its data, tests and tools into the HEARTH layout | History-preserving renames. One new file, `lib/evidence/files.mjs`, is the only reader of the disk. |
| `ea51277` | Repoint `.gitattributes` at the moved PSI files | The move had silently stopped protecting NASA's files from line-ending conversion. |
| `cafd641` | Rebrand through `lib/brand.ts`; blue flame logo | Identity only. |
| `eb31f09` | Two engine fixes found by the scientific review | Behaviour changes to the engine, isolated from the move. |
| `e6c34d5` | Will it burn?: page, API, brief, VESTA tool; corrected baseline claims | The feature. |
| `09422dc` | Cross-site check, response headers, dialog focus | Hardening. |
| (last) | Documentation, skills, archived HEARTH plan files, eval questions, regenerated Blueprint | Docs. |

### Where things went

| FlameScope v1 | Unified tree | Note |
|---|---|---|
| `src/compute/*.mjs` | `lib/evidence/*.mjs` | unchanged rules |
| `web/state.js`, `web/library.js` | `lib/evidence/client/` | request ordering and saved questions, already DOM-free |
| `data/*.csv`, `data/*.json` | `data/evidence/` | same blobs |
| `demo_fixtures/*` | `data/evidence/fixtures/` | NASA's PSI-25 table and the NTRS record |
| `src/agents/mcp-server.mjs` | `scripts/mcp-server.mjs` | no network call any more |
| `scripts/evaluate.mjs` | `scripts/evaluate-evidence.mjs` | |
| `test/*.test.mjs` (15 of 21) | `tests/evidence/` | run by vitest |
| `web/`, `src/api/`, `api/`, `vercel.json`, `src/agents/provider.mjs`, `evidence-selector.mjs`, `src/acquire/` | deleted | in history |
| `docs/planning/`, `docs/video/`, `docs/AI_USE.md`, `.claude/skills/`, `LICENSE` | in place | skills updated |

| HEARTH | Unified tree | Note |
|---|---|---|
| `app/`, `components/`, `lib/`, `scripts/`, `tests/`, `evals/`, `public/`, `data/processed/`, `Pseudo_DataKeep/` | in place | |
| `README.md`, `CLAUDE.md`, `MASTER_PROMPT.md`, `PROGRESS.md` | `docs/legacy/hearth/` | kept unchanged as records; their push and deploy instructions are not in force |
| `docs/MASTER_PROMPT.md`, `test.txt` | deleted | a byte-identical duplicate and a placeholder |

## 3. Technical problems met, and how each was settled

| Problem | Resolution |
|---|---|
| The engine read its data with `readFileSync(new URL('../../data/…', import.meta.url))`, which a bundler rewrites. | One loader resolves `data/evidence/` from the project root, as HEARTH already did for its prompt. `next.config.mjs` traces the files into every API route. Verified in the build output: 13 evidence files in each route's trace. |
| Two test runners. | The engine's suites needed one import changed to run under vitest; `vitest.config.ts` now also collects `*.test.mjs`. Cases that started the v1 server were dropped and replaced by route-handler tests. |
| `tsconfig.json` included `docs/video/remotion/**/*.tsx`. | `docs` is excluded; that workspace has its own toolchain. |
| HEARTH's `/api/search` and `/api/compare` already exist with other meanings. | The engine's routes live under `/api/burn/`. |
| The Blueprint test fails when a page, route, tool or module has no written explanation, or when a watched file changes unreviewed. | Explanations added for the page, two routes, the tool and `lib/burn.ts`; two honesty rules added; watched files re-read and marked at each step. |
| `prebuild` rewrites the tracked `public/blueprint.html` after every new commit, because the page embeds recent commit subjects. | Left as HEARTH designed it. The file is regenerated and committed with the work. Expect it to show as modified after a build. |
| A dev server left running during `next build` corrupted `.next` and produced a build that returned 500 on most routes. | Found during QA, not shipped: the build was repeated from a clean folder with no server running, and all routes then answered. Never build while a dev server is running in the same folder. |

## 4. What remains before this can replace `main`

In order. None of these was done, because each needs a decision or an authorisation that is not mine to give.

1. **Confirm HEARTH's licence.** HEARTH has no licence file. Its authors must agree to Apache-2.0, or choose
   otherwise, before the merged code is published under FlameScope's licence.
2. **Decide what to do with `fdce8c5`.** The integration branch is based on it, and it exists only locally.
   Pushing the integration branch publishes it too.
3. **Review the branch.** Open a pull request from `integration/flamescope-hearth` to `main`. Merge with a merge
   commit, not a squash, or HEARTH's history and authorship are lost.
4. **Hosting.** `main` may be connected to a Vercel project (`flame-scope.vercel.app` is mentioned in
   `docs/AI_USE.md`). If it is, merging replaces a zero-dependency static site with a Next.js build:
   - `vercel.json` is gone, so the project must build as a Next.js app (the default preset).
   - Set the model keys that should be live, and nothing else. Never set `FREELLMAPI_*` or `VESTA_EVAL_TOKEN`
     on a public host.
   - The build needs network access to Google Fonts.
   - The old HEARTH deployment (`project-hearth-five.vercel.app`) keeps serving the old name until it is
     redirected or retired. That is a separate, deliberate action.
5. **Science decisions** listed as deferred in [FEATURE_PARITY.md](FEATURE_PARITY.md): one mission catalogue,
   and how the gas "envelope" should report documented and inverse-layout rows.
6. **A second-person check** of the transcribed BASS-II tables, still marked pending in their provenance records.

## 5. Rolling back

The integration is one branch in one worktree, and nothing outside it changed except a second remote named
`hearth` in the shared repository configuration.

```powershell
git -C C:\GitHub\FlameScope worktree remove C:\GitHub\FlameScope-Integration
git -C C:\GitHub\FlameScope branch -D integration/flamescope-hearth
git -C C:\GitHub\FlameScope remote remove hearth
```

`C:\GitHub\FlameScope` (`will-it-burn` at `fdce8c5`), the HEARTH zip and both GitHub repositories are as they
were found.
