# RUN.md — Step 4 build run

Runs on Tharak's machine. Start it in Claude Code on Opus 5.5 with: **`Orchestrate RUN.md`**.
This file is the go-ahead to spawn agents. The models are already decided (below); don't ask about them.

## Roles
- **Orchestrator (you, Opus 5.5):** your jobs are to deploy the four workers, check, merge, note, and push.
  - "Check" means running the repo's check command and reading pass or fail. You don't review, test, or fix the workers' code.
  - The only file you write is `plans/RUN-LOG.md`.
- **Workers A–D (Sonnet 5.5, `claude-sonnet-5-5`):** each builds its packet, runs the checks, and commits on its own branch. Workers don't push.
- Nobody is watching. No one answers questions during the run. Tharak sees when it finishes.

## 0. Preflight
1. `git checkout main && git pull`. The working tree must be clean.
2. Confirm setup has landed. These must exist:
   - `plans/STEP-3-SETUP.md`
   - `plans/tasks/A.md` through `D.md`
   - the check command in `README.md`

   If any are missing, write "Setup not landed" to `plans/RUN-LOG.md` and stop.
3. Node must match `README.md`. If it doesn't, log it and stop.
4. Copy `.env.example` to `.env` if `.env` is missing. Keep the AI mode on `mock`: Ollama isn't installed on this machine.
5. Install dependencies from the lockfile and install the Playwright browsers, as `README.md` says.
6. Run the check command on `main`. If it fails, log the output and stop. A failing `main` is a setup problem for Loukik, not work for the workers.

## 1. Deploy the workers
Spawn all four at once:
- Agent tool, model `sonnet` (Sonnet 5.5)
- worktree isolation, each starting from the current `main`
- prompt: the worker prompt below, with `{X}` replaced by the worker's letter

| Worker | Packet | Screens |
|---|---|---|
| A | `plans/tasks/A.md` | 02 Needs and 03 Location (as edit screens), 12 Profile |
| B | `plans/tasks/B.md` | 08 Clinic detail, 09 Request form, 10 Letter preview |
| C | `plans/tasks/C.md` | 04 Find, 05 Results list, 06 Results map, 07 Empty results |
| D | `plans/tasks/D.md` | 11 Assistant |

Not in this run: the onboarding flow (01 Welcome, step progress, skip/resume), screen 13, and the optional features.

### Worker prompt
```
You are Worker {X} for CareFit. Your role is Code Agent (AGENTS.md): load the `ponytail` and `ui-ux-pro-max` skills.

Read, in order:
1. CLAUDE.md
2. plans/tasks/{X}.md: your scope, editable paths, and "done when"
3. plans/STEP-3-SETUP.md: contracts, match rules, and your section under "Worker scopes"
4. your screens in design/master/screens/

This run is unattended. Nobody will answer questions:
- Do CLAUDE.md's Code Step 1 (plan the edits) yourself and put the plan in your handoff. Then go straight to Step 2; don't wait for approval.
- If something is unclear or conflicts, take the reading closest to the mockup and the plan, keep going, and list it under "Decisions I made".
- Edit only your editable paths. Shared code is read-only: routing, shared components, contracts, storage, geo, match, server, package.json and the lockfile, config, and design/. If you need a change there, work around it inside your own paths and list it under "Integration needs".
- Don't add dependencies.
- The AI mode is `mock`. Ollama isn't installed on this machine.

Before you finish:
1. Run the check command from README.md. It must pass.
2. Go through your packet's "done when" items yourself, including using your screens with the keyboard only.
3. Commit everything on your branch with the message `Step 4 · Worker {X}: <summary>`. Don't push.

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
1. Copy its handoff into `plans/RUN-LOG.md`, labeled *worker-reported*.
2. On `main`, run `git merge --no-ff --no-commit <worker branch>`.
   - **If it conflicts:** run `git merge --abort`. Then message the same worker (SendMessage): "Merge current main into your branch, resolve the conflicts keeping both sides' behavior, rerun the check, commit, and send a new handoff." When the new handoff arrives, start again at step 1.
3. Run the check command.
   - **If it passes:** commit the merge as `Merge Worker {X}: <summary>`, commit the log update, and push `main`.
   - **If it fails:** run `git merge --abort`. Send the failing output to the worker to fix on its branch. When the fix arrives, start again at step 1.
4. After two failed rounds for the same worker, stop retrying. Leave it unmerged and log it as **Blocked**, with the last output.
5. If a push is rejected, run `git pull --no-rebase`, rerun the check, and push again.

## 3. Note → `plans/RUN-LOG.md`
```
# Step 4 run log
Started: <date time> · Base: <setup commit>

## Status
| Worker | Status (running / merged / blocked) | Branch | Merge commit | Check after merge |

## Worker A (worker-reported)
<handoff, verbatim>
Orchestrator: merged at <commit>; check passed. (Or: blocked; <failure summary>)

… B, C, D …

## For the team after pull
- Integration needs from every handoff, as one list
- Decisions workers made, as one list
- Test Worker D live with Ollama on Loukik's Mac (this run used mock mode only)
- Install on a phone through the Funnel URL
```

## 4. Finish
When all four workers are merged or blocked:
1. Update the status table, commit the log, and push `main`.
2. Your final message: one line per worker (merged or blocked), plus the final `main` commit.

Don't start any more work after that: no onboarding, fixes, or polish.

## Rules
- Never edit code, tests, design, or docs. The only exception is `plans/RUN-LOG.md`.
- Commit only merges and the log. Never commit build or test output.
- Never force-push or rewrite the history of `main`.
- Never push a `main` that fails the check.
- Don't judge the quality of the work. The team reviews and tests it after pulling.
- Workers use Sonnet 5.5 only.
