# Chunk plan

Source: [DISCUSS.md](DISCUSS.md)
Based on spec revision: TBD
Plan / integration owner: TBD

No project chunks are planned yet. First select the MVP in DISCUSS.md. Create
each chunk from [the chunk template](templates/CHUNK.md), saving it under
`docs/chunks/C01-short-name.md`, and link it in the index below.

## Chunk index

| ID / detail file | Demoable outcome | Requirements | Owner | Depends on | Status | Latest session |
| --- | --- | --- | --- | --- | --- | --- |

Use `todo`, `in_progress`, `review`, `done`, or `blocked`. This index is the
source of truth for chunk status; keep acceptance evidence in the chunk file.
For blocked chunks, record the reason and exact unblock action in that file.

## Planning rules

- Start with the smallest useful path through the app. Validate a critical
  integration early if it could invalidate the project.
- Give each chunk one owner, a bounded outcome, and observable acceptance
  criteria. Aim for one to three sessions, splitting larger chunks.
- Link every must-have requirement to at least one chunk. Name dependencies
  by chunk ID; only plan parallel work after shared interfaces are settled.
- Put setup work in an explicit chunk when needed, with a runnable result and
  actual setup/check commands recorded in README.
- Include an integration/demo chunk that checks the complete user journey from
  a clean starting state, including any agreed fallback.
- Do not start a dependent chunk until its dependencies are done and available
  in the working checkout. Recheck the combined flow after integration.

## Coverage check

| Requirement ID | Implementing chunk(s) | Where the acceptance check runs |
| --- | --- | --- |

## Current coordination notes

Use this section only for cross-chunk issues, shared-file ownership, and
integration order. Keep detailed implementation notes in the relevant chunk.

## Project completion

- [ ] Every must-have requirement is covered by a completed chunk.
- [ ] Required checks and reviews pass, with evidence in session records.
- [ ] All required changes are integrated and the full demo has been rehearsed.
- [ ] README has working setup, run, and check instructions.
- [ ] Remaining limitations and stretch work are recorded in DISCUSS.md.
