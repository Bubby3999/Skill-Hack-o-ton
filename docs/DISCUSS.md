# Discussion and build specification

Status: draft
Spec revision: 0
Team / decision owner: TBD
Hackathon deadline and timezone: TBD
Last updated: TBD

Use `draft` while exploring and `ready` once the selected MVP is clear enough to
build. Record existing agreement from the conversation; another approval round
is unnecessary. Increment the revision when agreed scope changes. This file is
the source of truth for what the project does and why.

## Exploration — Helper and team

### Problem and audience

- Who has the problem?
- What do they do today, and where does it fail?
- What single improvement should our demo prove?

### Ideas and alternatives

| Option | Useful outcome | Tradeoff / uncertainty | Team preference |
| --- | --- | --- | --- |
| TBD | TBD | TBD | Undecided |

### Sketches and notes

Add a Mermaid user-flow or architecture diagram when it clarifies an idea.
Label proposed flows; do not treat brainstorming as an implementation decision.
Capture useful notes from each team member and link reference material here.

## Build specification — Discuss

### Product in one sentence

TBD: For [user], build [product] so they can [outcome].

### Main user journey

TBD: Describe the starting state, user actions, system responses, and successful
end state. Include the essential empty, loading, and error behavior where relevant.

### MVP requirements

Assign stable IDs so the plan and checks can refer back to each requirement.
Acceptance criteria describe observable behavior, not implementation activity.

| ID | User-visible requirement | Acceptance criterion | Priority |
| --- | --- | --- | --- |
| R01 | TBD | Given ___, when ___, then ___ | Must |

### Out of scope and stretch ideas

- Explicit exclusions: TBD
- Stretch work only after the MVP passes: TBD

### Architecture and interfaces

- Chosen stack and rationale: TBD
- Components and responsibilities: TBD
- Data model and persistence: TBD
- Inputs, outputs, shared API contracts, and error behavior: TBD
- External services, access requirements, and demo fallback: TBD
- Diagram: add one if it makes component boundaries or data flow clearer.

Mark a section `not applicable` with a brief reason when it is unnecessary.

### Constraints and risks

- Team capacity, ownership, and available time: TBD
- Required devices, platform, budget, or hackathon rules: TBD
- Data/privacy constraints that affect the design: TBD
- Highest-risk assumption and quickest way to validate it: TBD

### Open questions and assumptions

| Question / assumption | Impact if wrong | Blocks which work? | Owner / resolution |
| --- | --- | --- | --- |
| Project idea and target user are not selected yet | MVP is undefined | Implementation planning | Team: choose the idea |

Resolve questions that block the selected work. Record reasonable, reversible
assumptions explicitly; ask the team only about material unresolved choices.

### Demo and success

- Starting state and sample data: TBD
- Exact walkthrough from start to useful result: TBD
- Observable proof that the MVP works: TBD
- Fallback if a required external service is unavailable: TBD

### Decision log

| Revision / date | Decision | Why / alternatives considered | Team agreement source | Affected requirements / chunks |
| --- | --- | --- | --- | --- |

### Ready to plan

- [ ] The team has chosen the problem, audience, and MVP.
- [ ] Must-have requirements have observable acceptance criteria.
- [ ] Exclusions, constraints, and the main user journey are written down.
- [ ] Blocking questions for the chosen work are resolved.
- [ ] A concrete demo walkthrough is defined.

The Planner can draft chunks to expose gaps before this checklist is complete;
implementation uses only the settled scope.
