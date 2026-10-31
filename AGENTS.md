# AGENTS.md

## Identify your role and load skills

- Planner Agent: load skills agent-search and graphify (use when asked)
    - Goal: set up the coding agent for success
    - Rules: do not edit code files unless exempted
- Researcher: load skill agent-search
- Code Agent: load skills ponytail and ui-ux-pro-max if frontend
- UI Tester Agent: load skill playwright

## Orchestration

- No agents will be spawned unless a word like "orchestrate" is commanded
- Harnesses: Claude Code and Codex (GPT). You can deploy models from either harness using functions; both are enabled.
- When research outside the repo or UI/UX examples are needed, propose a research agent.
- If you want to orchestrate a batch, let me know so we can decide the number of sessions.

## Models

Primary models that are in play:

   1. Claude Opus: Plan + Complex reasoner
   2. GPT Astra: Plan + Complex reasoner
   3. Claude Sonnet: The default agent for code and research
   4. GPT Sol: the default code agent
   5. Claude Haiku: default agent for simple code and quick grab
   6. GPT Terra: quick grab + go or computer use.
