# RUN.md — Step 4 build run

> **Done (2026-10-31).** All four workers are merged. Results are in [`plans/RUN-LOG.md`](plans/RUN-LOG.md). Don't run it again.

Runs on Loukik's Mac. Start it in a new Claude Code session at the repo root, on Opus 5.5 in auto mode, with: **`Orchestrate RUN.md`**.
This file is the go-ahead to spawn agents. The models are already decided (below); don't ask about them and don't swap them, including on fix rounds.

## Roles
- **Orchestrator (you, Opus 5.5):** your jobs are to deploy the four workers, check, merge, note, and push.
  - "Check" means running `npm run check` and reading pass or fail. You don't review, test, or fix the workers' code.
  - You may do git mechanics for a worker: creating worktrees, installing dependencies, and committing a worker's changes as-is.
  - The only file you write is `plans/RUN-LOG.md`.
- **Workers:** each builds its packet, runs the checks, and commits on its own branch. Workers never push.

| Worker | Model | Launched with | Packet | Screens |
|---|---|---|---|---|
| A | GPT Sol (`gpt-6.1-sol`) | Codex CLI | `plans/tasks/A.md` | 02 Needs and 03 Location (edit screens), 12 Profile |
| B | GPT Sol (`gpt-6.1-sol`) | Codex CLI | `plans/tasks/B.md` | 08 Clinic detail, 09 Request form, 10 Letter preview |
| C | Sonnet 5.5 (`claude-sonnet-5-5`) | Agent tool | `plans/tasks/C.md` | 04 Find, 05 Results list, 06 Results map, 07 Empty results |
| D | GPT Sol (`gpt-6.1-sol`) | Codex CLI | `plans/tasks/D.md` | 11 Assistant |

Not in this run: the onboarding flow (01 Welcome, step progress, skip/resume), screen 13, and the optional features.
Nobody is watching, and no one answers questions during the run. Loukik sees when it finishes.

## 0. Preflight
Stop at the first failure, write the reason to `plans/RUN-LOG.md`, and don't push.
1. `git checkout main && git pull`. The working tree must be clean. If the only change is an untracked `plans/RUN-LOG.md` left by a stopped run, delete it.
2. Confirm setup has landed: `plans/tasks/A.md`–`D.md` exist, and `package.json` has a `check` script.
3. `node -v` must start with `v24`, and `codex --version` must work.
4. Leave `.env` as it is. The AI mode stays `mock`: `.env` sets no `AI_MODE`, and the check forces mock anyway. Ollama runs on this Mac, but nobody calls it during this run.
5. In the repo root, run `npm ci` and `npx playwright install chromium`.
6. Run `npm run check` on `main`. If it fails, that's a setup problem for Loukik, not work for the workers.
7. Create a run folder outside the repo, for example in your scratchpad. It's called `RUN_DIR` below.

## 1. Deploy the workers
Start all four, so they run at the same time.

### Sol workers: A, B, D
For each `X`:
1. `git worktree add "$RUN_DIR/wt-X" -b step4/X main`
2. `cd "$RUN_DIR/wt-X" && npm ci`. You install here because worktrees don't share `node_modules`, and the worker's sandbox may block network. The Playwright browsers are shared and already installed.
3. Write the worker prompt (below), with `{X}` filled in, to `$RUN_DIR/prompt-X.md`.
4. Launch it with the Bash tool and `run_in_background: true`:
   ```
   codex exec -m gpt-6.1-sol -C "$RUN_DIR/wt-X" --approve-for-me \
     -o "$RUN_DIR/handoff-X.md" - < "$RUN_DIR/prompt-X.md" > "$RUN_DIR/log-X.txt" 2>&1
   ```
   `--approve-for-me` keeps Codex's workspace sandbox and routes escalations to automatic review, like auto mode. Never use `--dangerously-bypass-approvals-and-sandbox`.
5. When the command exits, the worker is done, and its handoff is in `$RUN_DIR/handoff-X.md`.

### Sonnet worker: C
Agent tool, model `sonnet`, worktree isolation, starting from the current `main`. The prompt is the worker prompt below with `{X}` = C. Its final message is its handoff.

### Worker prompt
```
You are Worker {X} for CareFit. Your role is Code Agent (AGENTS.md). Load your skills by reading .agents/skills/ponytail/SKILL.md and .agents/skills/ui-ux-pro-max/SKILL.md, and follow them.

Read, in order:
1. CLAUDE.md
2. plans/tasks/{X}.md: your scope, editable paths, and "done when"
3. plans/STEP-3-SETUP.md: contracts, match rules, and your section under "Worker scopes"
4. your screens in design/master/screens/

This run is unattended. Nobody will answer questions:
- Do CLAUDE.md's Code Step 1 (plan the edits) yourself and put the plan in your handoff. Then go straight to Step 2; don't wait for approval.
- If something is unclear or conflicts, take the reading closest to the mockup and the plan, keep going, and list it under "Decisions I made".
- Edit only your editable paths. Shared code is read-only: routing, shared components, contracts, storage, geo, match, server (except Worker D's server/assistant/), package.json and the lockfile, config, design/, and plans/. If you need a change there, work around it inside your own paths and list it under "Integration needs".
- Don't add dependencies. node_modules is already installed; if it's missing, run `npm ci`.
- The AI mode is `mock`. Don't call Ollama or switch to live mode.

Before you finish:
1. Run `npm run check`. It must pass. If your sandbox blocks part of it (for example, the Playwright test server), run `npm run typecheck && npm run test:unit` instead, and say exactly what was blocked. The orchestrator runs the full check after merging.
2. Go through your packet's "done when" items yourself, including using your screens with the keyboard only.
3. Commit everything on your branch as `Step 4 · Worker {X}: <summary>`. If your sandbox blocks the commit, leave the changes in place and say so; the orchestrator will commit them. Don't push.

End with this handoff and nothing else:

## Worker {X} handoff
- Branch / commit:
- Plan (Step 1):
- Done (behavior a user can see):
- Checks run and results:
- Decisions I made:
- Known gaps:
- Integration needs:
```

## 2. Merge each worker as it finishes
Take workers in the order they finish. For each one:
1. **Handoff:** copy it into `plans/RUN-LOG.md`, labeled *worker-reported*. For Sol workers it's `handoff-X.md`; if that file is empty, use the end of `log-X.txt` and note "no handoff".
2. **Uncommitted work:** if `git -C <worktree> status --porcelain` shows changes, commit them as-is: `git -C <worktree> add -A && git -C <worktree> commit -m "Step 4 · Worker X: <summary from handoff>"`. If the branch has no changes at all, log the worker as **Blocked: no changes**.
3. **Merge:** in the repo root, on `main`, run `git merge --no-ff --no-commit step4/X`. Use C's branch name from its worktree.
   - **If it conflicts:** run `git merge --abort`, then run a fix round (below) for a conflict.
4. **Check:** run `npm run check` in the repo root.
   - **If it passes:** commit the merge as `Merge Worker X: <summary>`, commit the log update, and push `main`.
   - **If it fails:** run `git merge --abort`, then run a fix round with the failing output.
5. **Fix round:**
   - **Sol worker:**
     - If it's a conflict, first run `git -C <worktree> merge main` yourself and leave the conflict markers in place.
     - Then rerun the same `codex exec` command, in the same worktree and with the same `-o` file, using this prompt: "You are Worker X again. Read plans/tasks/X.md and your previous handoff at <path>. The orchestrator couldn't merge your branch: <the conflict files: resolve them, keeping both sides' behavior | the failing check output below>. Fix it in your editable paths, rerun the check, commit if you can, and end with a new handoff in the same format."
   - **Sonnet worker:** send the same text to the same agent with SendMessage. It can run `git merge main` itself.
   - When the new handoff arrives, start again at step 1.
6. **Limit:** after two failed rounds for the same worker, stop retrying. Leave it unmerged and log it as **Blocked**, with the last output.
7. **Rejected push:** run `git pull --no-rebase`, rerun the check, and push again.

## 3. Note → `plans/RUN-LOG.md`
```
# Step 4 run log
Started: <date time> · Base: <setup commit>

## Status
| Worker | Model | Status (running / merged / blocked) | Branch | Merge commit | Check after merge |

## Worker A (worker-reported)
<handoff, verbatim>
Orchestrator: merged at <commit>; check passed. (Or: blocked; <failure summary>.) Committed for the worker: yes/no.

… B, C, D …

## For the team
- Integration needs from every handoff, as one list
- Decisions workers made, as one list
- Anything a worker said its sandbox blocked
- Test Worker D live: AI_MODE=live with Ollama (this run used mock only)
- Install on a phone through the Funnel URL (README)
```

## 4. Finish
When all four workers are merged or blocked:
1. Update the status table, commit the log, and push `main`.
2. Remove the merged workers' worktrees with `git worktree remove`. Keep the branches, and keep any worktree whose worker is blocked.
3. Your final message: one line per worker (merged or blocked), plus the final `main` commit.

Don't start any more work after that: no onboarding, fixes, or polish.

## Rules
- Never edit code, tests, design, or docs. The only exception is `plans/RUN-LOG.md`.
- You may commit only three things: merges, a worker's changes as-is, and the log. Never commit build or test output.
- Never force-push or rewrite the history of `main`.
- Never push a `main` that fails the check.
- Don't judge the quality of the work. The team reviews and tests it after the run.
- The models are fixed: A, B, and D run `gpt-6.1-sol` through Codex; C runs Sonnet 5.5.
- Never disable the Codex sandbox.
- Don't call Ollama or set `AI_MODE=live` during the run.
