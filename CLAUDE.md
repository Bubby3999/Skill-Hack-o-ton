# CLAUDE.md

- PROJECT.md is what we are building; STEP-PLAN.md is the phase plan; plan files live in `plans/`.
- Read AGENTS.md first to identify your role and the required skills. It's mandatory.
- The process is planning (with Q&A to resolve ambiguities) --> writing the plan file --> coding sessions.
- Orchestrate only when asked.
- Do not spawn agents or orchestrate without deciding the model with me.

## Skills

| Skill | Purpose | Use when |
|---|---|---|
| agent-search | web search and source extraction | use for UI/UX design references and other research outside the repo |
| playwright | browser access and automation | use for testing and viewing pages if needed. Optional |
| ponytail | focused code changes | use for coding, especially backend |
| ui-ux-pro-max | UI and UX design guidance | use when coding frontend; not necessary for backend work |
| graphify | graph-based codebase analysis | use when asked, mostly for presenting the workflow |


## Writing (for UI/UX)

- Keep writing minimal by default.
- When an "explanation page" appears, explain precisely and concisely.

## Plan

- Plan what needs to be built, what the final output should look like, and what it should include.
- Clear up ambiguities before finalizing.
- Be concise when possible.
- **The features** — what the user gets and how it behaves. Discussion first, open to many questions; no ambiguity leaves the session.
- **The direction** — the decisions, constraints, watch-outs from the current code, and what is out of scope, each with its reason.
- **Never the code changes.** Which files change and how is Code's Step 1's job

## Code

- Step 1: plan code edits; Step 2: implement them. If step 1 reveals conflicts, let me know.
- Keep comments short and clear; add them when needed.

