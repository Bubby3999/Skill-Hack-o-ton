# CareFit — Step Plan

**How to use this file**
- Each step has five parts: **Goal**, **Plan**, **Execution** (checkboxes), **Decisions**, and **Done when**.
- Decisions are left open on purpose. When you make one, check its box, write your choice next to it, and copy it into the **Decision log** at the bottom.
- `PROJECT.md` is the source of truth for scope. If a step changes the scope, update `PROJECT.md` first.
- Every step also has a **Time box** line. Fill it in once you know how long the hackathon is.

---

## Step 1 — Finalize the idea

**Goal:** Lock the name, description, scope, and theme fit, so every later step builds toward the same pitch.

**Plan:** Review `PROJECT.md`, edit it until it sounds like you, check it against the judging criteria, then freeze it.

**Time box:** ___

**Execution**
- [x] Pick a name → **CareFit**
- [x] Read the One-liner and Pitch in `PROJECT.md`; rewrite anything that doesn't sound like you
- [x] Find the hackathon's judging criteria; write each one down and map it to a CareFit feature
- [ ] Any criterion with no matching feature: add a feature or change the pitch
- [ ] Review the Necessary / Optional split; move items between the lists if needed
- [ ] Search the hackathon's project list (and the App Store) for name conflicts
- [ ] Commit `PROJECT.md` and `STEP-PLAN.md` to the repo

**Decisions**
- [ ] **Scope:** mobility-first headline with a multi-disability profile, or mobility only? Multi-disability reaches more users and fits the theme more broadly. Mobility only is simpler to build and pitch.
- [x] **Clinic data:** real clinics labeled "Demo data", or fictional clinics in a real area? Real names make the demo feel real, but the equipment data is made up. Fictional avoids presenting false claims about real businesses. → **Fictional clinics in a real area**
- [x] **Demo area:** which city/ZIP the seed data covers → **Oakland, CA; default ZIP 94612**

**Done when**
- You can pitch CareFit in 30 seconds without notes
- Every judging criterion maps to something in the build list

---

## Step 2 — Frontend mockup designs

**Goal:** One **master design template**. The build follows it screen by screen.

**Plan:** Opus only (no time for a two-model comparison). Opus writes the brief, designs every screen against it, then self-checks. Later fixes are surgical edits (Sol) made directly in `design/master/`.

**Time box:** ___

### 2.1 Write the design brief → `design/BRIEF.md`
- [x] Product summary (copy from `PROJECT.md`)
- [x] Screen list:
  1. Onboarding / profile setup
  2. Home / search, with a way into the assistant
  3. Results: list + map, with match badges
  4. Clinic detail: access checklist, last-verified date, call / directions
  5. Accommodation request form → letter preview
  6. AI assistant chat
  7. Profile / settings (edit needs, reset demo)
  8. *(Optional)* Report a gap
- [x] Data each screen shows (point to the fields in `PROJECT.md` → Build list #1 and #3)
- [x] Accessibility constraints:
  - WCAG 2.2 AA contrast
  - 44×44px minimum tap targets
  - Layout survives 200% text size
  - No information by color alone
  - Visible focus states
  - Reduced-motion variant
- [x] Device frame: a phone viewport, e.g. 390×844
- [x] Output format: HTML/CSS, one file per screen, plus a board that shows them all

### 2.2 Design the master (Opus) → `design/master/`
- [x] **Design tokens** in one file → `design/master/tokens.css`: colors, type scale, spacing, radius, shadows, motion
- [x] Shared component styles → `design/master/components.css`
- [x] **Component list** → `design/master/components.html` (every component and its states) + `design/master/README.md`
- [x] Every MVP screen → `design/master/screens/`, linked as a clickable prototype
- [x] Board with all screens in phone frames → `design/master/index.html`

### 2.3 Self-check
- [x] Run every text/background color pair through a contrast checker → `design/master/CONTRAST.md`
- [x] Screenshot every screen at 390×844, at 200% text, and on a 320px-wide phone
- [x] Keyboard pass: visible focus, skip link, tab order
- [x] Rubric review: accessibility, clarity, match readability, polish, buildability, distinctiveness

**Decisions**
- [x] **Output format:** HTML/CSS per screen + board. The easiest base to build from and to hand-edit.
- [x] **Navigation pattern:** bottom tabs (Find · Ask · Profile) + a linear onboarding before them
- [x] **Base design:** n/a (single model)
- [x] **Themes:** light only, with semantic tokens so dark/high-contrast (optional feature) can be added later

**Done when**
- Every MVP screen exists in `design/master/`
- The tokens file exists
- Every color pair passes AA

---

## Step 3 — Set up dependencies, tools, skills

**Goal:** A repo that:
- runs locally
- serves over HTTPS from Loukik's Mac (Tailscale Funnel)
- installs as a PWA on your phone
- has a working `/api/chat` (mock mode first; live once Ollama is installed)
- has the dev harness configured

All of this before any feature code.

**Plan:** One Sonnet 5.5 setup session follows [`plans/STEP-3-SETUP.md`](plans/STEP-3-SETUP.md). It also builds the shared pieces that more than one Step 4 worker needs: contracts, shared components, the match engine, and the clinic dataset.

**Time box:** ___

### 3.1 Make the stack decisions (see Decisions below)
- [x] Framework
- [x] Language
- [x] CSS approach
- [x] Host
- [x] LLM provider and model (the exact model tag is set when Ollama is installed)

### 3.2 Scaffold
- [ ] Initialize the project with the chosen framework
- [ ] Create the folder structure (adjust to the framework's conventions):
  ```
  src/screens/      src/components/    src/lib/storage
  src/lib/match     src/lib/geo        src/lib/letter
  src/data/clinics.json
  server/ (app + /api/chat)   scripts/    design/    tests/
  ```
- [x] `.gitignore` that includes `.env`
- [ ] *(Optional)* Linter and formatter

### 3.3 Configure the harness (`Bubby3999/Skill-Hack-o-ton`)
- [ ] `CLAUDE.md`: finalize the skills (`agent-search`, `ponytail`, `ui-ux-pro-max`, `graphify`, plus others)
- [ ] `CLAUDE.md`: add project rules:
  - Read `PROJECT.md` and `design/master/` before building anything
  - Every component must be accessible by default (labels, focus, contrast, target size)
  - All `localStorage` access goes through `src/lib/storage` only
  - The browser never calls Ollama directly; only through `/api/chat`
  - Follow the design tokens; no one-off colors or sizes
- [ ] `AGENTS.md`: enter the lineup (which agent/model handles which kind of work)
- [ ] Confirm Playwright runs with one smoke test
- [ ] Worker packets for Step 4 → `plans/tasks/A.md`–`D.md`

### 3.4 Install dependencies (from `PROJECT.md` → Outside sources)
- [ ] Leaflet (plus a framework wrapper if needed)
- [ ] Lucide icons; self-hosted Atkinson Hyperlegible Next
- [ ] PWA tooling (vite-plugin-pwa) and the manifest
- [ ] No LLM SDK: the server calls Ollama's HTTP API
- [ ] Vitest and `@axe-core/playwright`

### 3.5 Shared foundations (moved up from Step 4 so parallel workers don't build against stubs)
- [ ] App shell: routes for screens 01–12, tabs, skip link, landmarks, focus on navigation (was 4.1)
- [ ] Contracts, storage module, geo (distance, geolocation, ZIP table)
- [ ] Shared components used by two or more workers
- [ ] Match engine + unit tests (was 4.4)
- [ ] Fictional clinic dataset + validation (was 4.3)

### 3.6 AI server skeleton
- [ ] Node server that serves the built app and `/api/*` on one port
- [ ] `POST /api/chat` → local Ollama `POST /api/chat`; an explicit mock mode; `GET /api/health`
- [ ] Read `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and the AI mode from `.env`
- [ ] Cap request size and message count (demo server, no auth)

### 3.7 Serve over HTTPS
- [ ] Run the production server on Loukik's Mac
- [ ] Expose it with Tailscale Funnel; confirm it's served over HTTPS (geolocation and PWA install both need it)
- [ ] Open the URL on your phone and install it
- [ ] Call `/api/chat` from the phone and get a reply (mock, then live)

**Decisions**
- [x] **Framework:** Vite + React. Biggest ecosystem, and the harness writes it most reliably.
- [x] **Language:** TypeScript. Four parallel workers share the profile, clinic, and filter shapes.
- [x] **CSS:** plain CSS: the master `tokens.css` + `components.css`, ported as-is.
- [x] **Host:** Loukik's Mac (runs Ollama) + Tailscale Funnel. A serverless host can't reach a laptop's `localhost`. Funnel gives a stable HTTPS URL, so the installed PWA survives restarts.
- [x] **LLM provider and model:** local Ollama with JSON-schema structured output. Exact model tag: ___ (set in `.env` after install).

**Done when**
- The Funnel URL loads on your phone and installs as an app
- `/api/chat` returns a test reply (mock mode; live once Ollama is installed)
- Match-engine tests pass, and every route is reachable by keyboard

---

## Step 4 — Build the designs and integrate

**Goal:** Every MVP feature works end to end on the deployed app and matches the master design.

**Plan:** Four parallel workers run on Loukik's Mac: A, B, and D on GPT Sol through the Codex CLI, and C on Sonnet 5.5. An Opus orchestrator starts them by following [`RUN.md`](RUN.md). It merges each worker into `main` and pushes. It doesn't review the code; the team pulls, reviews, and tests. Scopes are in [`plans/STEP-3-SETUP.md`](plans/STEP-3-SETUP.md) → Worker scopes.

**Status (2026-10-31):**
- **The run:** all four workers merged into `main`, and the check passed after each merge. The orchestrated Codex runs were rejected by the ChatGPT-account login, so Loukik reran A, B and D in Codex by hand. Details: [`plans/RUN-LOG.md`](plans/RUN-LOG.md).
- **In progress:** onboarding (01 Welcome, step progress, skip/resume) and Report a gap (13) are being built in a separate session, along with the fixes for the gaps the workers reported.

**Time box:** ___

### Chunk loop (repeat for every chunk)
- [ ] Write the chunk spec:
  - which screens (from `design/master/`)
  - what data it reads and writes
  - its "done when"
- [ ] Build it with the harness
- [ ] Review the diff yourself; don't merge code you haven't read
- [ ] Quick test: tab through it with the keyboard, plus one screen reader pass on the new screen
- [ ] Commit

### 4.1 App shell
*Built in Step 3.5.*

- [ ] Navigation between all screens (placeholder content is fine)
- [ ] Tokens and base components from the master
- [ ] Skip link, landmarks (`header`/`main`/`nav`), and moving focus to the new screen on navigation

**Done when:** you can reach every screen using only the keyboard.

### 4.2 Storage, profile, onboarding
- [ ] `src/lib/storage`:
  - `get`, `set`, `remove`, `clear`
  - safe JSON parsing
  - a schema version key
- [ ] Profile schema (`PROJECT.md` → Build list #1)
- [ ] Onboarding flow that writes the profile: *deferred, build if time. Until then, the app starts with the demo profile.*
- [ ] Profile/settings screen to edit needs
- [ ] **Reset demo** control

**Done when:** the profile survives a reload, and clearing storage restores the demo profile.

### 4.3 Clinic library
*Built in Step 3.5 as a fictional dataset (no NPI seed or geocoding).*

- [ ] Seed script:
  - get clinic info (NPI Registry or fictional)
  - geocode it
  - add access features
  - write `src/data/clinics.json`
- [ ] Mix the statuses (verified / patient-reported / unknown / not-available) so matches vary
- [ ] Include clinics that are close but a poor match, and farther but a perfect match (makes the demo more interesting)

**Done when:** every clinic has coordinates and valid fields.

### 4.4 Match engine
*Built in Step 3.5. Rules: `plans/STEP-3-SETUP.md` §7.*

- [ ] Pure function `(profile, clinic, userLocation) → { score, has[], missing[], unknown[], distance }`
- [ ] Unit tests with at least 5 hand-written cases, including edge cases

**Done when:** tests pass, and any result can be explained in one sentence.

### 4.5 Search + results
- [ ] Location: request permission, with a ZIP fallback if denied
- [ ] Filters: specialty, radius, needs (pre-filled from the profile)
- [ ] List view: cards show score + reasons as text
- [ ] Map view: Leaflet markers synced with the list
- [ ] Sort: best match / nearest
- [ ] Empty state

**Done when:** changing a need in the profile changes the results.

### 4.6 Clinic detail
- [ ] Info, doctors, hours, `tel:` link, directions link
- [ ] Access checklist: status, last-verified date, source
- [ ] Buttons for the request letter (and any optional features)

**Done when:** every field from `clinics.json` renders, and screen readers announce every status clearly.

### 4.7 Accommodation request form
- [ ] Form auto-filled from the profile and the clinic; every field editable
- [ ] Appointment date + the specific accommodations to request
- [ ] Accessible form markup:
  - real `<label>`s
  - `fieldset`/`legend` for checkbox groups
  - errors announced to screen readers
- [ ] Letter template citing Section 504 / ADA in general terms, plus a "not legal advice" note
- [ ] Output: copy, Web Share, `mailto:`, print / save as PDF
- [ ] Save drafts to storage

**Done when:** a letter can be generated in 3 taps or fewer from clinic detail.

### 4.8 AI assistant
- [ ] Chat UI where new messages go in an ARIA live region
- [ ] System prompt covering:
  - its role
  - the parts of the profile it's given
  - returning filters as structured JSON
  - no medical advice
- [ ] The app applies the returned filters and shows results
- [ ] A notice on the chat screen saying what profile data gets sent
- [ ] Failure handling: if `/api/chat` or Ollama is down or slow, show a friendly message and a link to manual filters

**Done when:** *"OB-GYN within 15 miles who can weigh me seated"* returns correctly filtered results.

### 4.9 PWA
- [ ] Manifest: name, short name, icons (192, 512, maskable), theme color, `display: standalone`
- [ ] Service worker: cache the app shell and `clinics.json`; add an offline fallback
- [ ] Test the install on iOS and Android if you can

**Done when:** in airplane mode, the app still opens with the saved profile and cached clinics.

### 4.10 Optional features (only after 4.1–4.9 are done)
- [ ] Rank the optional list in `PROJECT.md` by demo impact ÷ build time
- [ ] Build from the top using the chunk loop; stop at your time box
- [ ] Update the pitch in `PROJECT.md` for anything that ships

**Decisions**
- [x] **Chunk order:** shared chunks (4.1, 4.3, 4.4) move to Step 3; the rest split by screen across workers A–D
- [x] **Parallel agents or one at a time:** parallel, four workers in separate branches/worktrees; screens don't overlap
- [x] **Scoring rules for the match engine:** the tiers drawn in the mockups; see `plans/STEP-3-SETUP.md` §7
  - how much required needs weigh versus nice-to-haves
  - whether `unknown` counts as partial credit or zero
  - how much distance matters
- [x] **Number of seed clinics:** enough to fill a map, but few enough to check by hand → about 20

**Done when:** the full flow (onboarding → search → detail → letter → assistant) works on your phone using the deployed URL.

---

## Step 5 — Build checks

**Goal:** Catch bugs and accessibility failures before the judges do. At an accessibility hackathon, an inaccessible app undercuts the pitch.

**Plan:** Manual testing only, then submit (Step 6). `npm run check` already covers the automated checks in 5.1, so there's no separate automated pass. Run 5.2 and 5.3 by hand, then triage and fix.

**Time box:** ___

### 5.1 Automated
*Covered by `npm run check`: Vitest, plus Playwright and axe on every route. Lighthouse and the "only `/api/chat`" check are done by hand, if time allows.*

- [ ] Vitest: match engine, storage module, letter generator
- [ ] Playwright end-to-end tests:
  - onboarding → search → detail → letter
  - assistant flow in mock mode
- [ ] axe scan on every screen; target 0 serious or critical issues
- [ ] Lighthouse: record the accessibility, best-practices, and PWA scores
- [ ] Confirm the browser only calls `/api/chat`, never Ollama directly

### 5.2 Manual accessibility
- [ ] Keyboard only: every action reachable, focus always visible, no focus traps
- [ ] VoiceOver (iOS): full flow
- [ ] TalkBack (Android): full flow, if you have a device
- [ ] Largest system text size / 200% zoom: nothing cut off or overlapping
- [ ] Reduced motion turned on: no unwanted animations
- [ ] Grayscale / color-blindness simulation: statuses still readable
- [ ] *(Optional)* Voice Control or Switch Control

### 5.3 Edge cases
- [ ] Location permission denied → ZIP fallback works
- [ ] No clinics match → empty state
- [ ] Offline → cached data loads
- [ ] Empty or corrupted `localStorage` → no crash; returns to onboarding
- [ ] `/api/chat` or Ollama fails or is slow → fallback message
- [ ] Very long names and text → layout holds

### 5.4 Real-user check (optional, high value)
- [ ] If you can, have a disabled person (or someone who works with disabled patients) try the flow
- [ ] Write their feedback down word for word; use one line in the pitch if they agree

### 5.5 Triage and fix
- [ ] Sort every issue into one of three groups: **Blocker**, **Visible in demo**, **Cosmetic**
- [ ] Fix every Blocker and Visible-in-demo issue
- [ ] Log the rest under "Future work" in the README

**Decisions**
- [ ] **Minimum acceptable Lighthouse accessibility score**
- [ ] **What's cut** if time runs short: which optional features or polish items get dropped

**Done when**
- 0 critical axe issues
- The full flow works with a screen reader
- The end-to-end tests pass

---

## Step 6 — Demo + submission *(added; not in your original 5)*

**Goal:** Turn the working app into a 2–3 minute presentation that wins.

**Plan:** Write the story, script the demo, prepare a backup, prepare submission materials, rehearse.

**Time box:** ___

**Execution**
- [ ] Story arc: problem (a real person's experience) → why now (the July 2026 rule) → live demo → privacy → what's next
- [ ] Demo script with exact taps; preload a demo profile; use **Reset demo** before you start
- [ ] Show one accessibility moment live (e.g., navigate a screen with VoiceOver on)
- [ ] Backup: screen recording of the full flow, in case Wi-Fi or the AI fails
- [ ] README: what it is, screenshots, stack, how to run it, future work
- [ ] Submission page: description (from `PROJECT.md`), video, repo link, live URL
- [ ] Prepare answers for likely judge questions:
  - *Where does the equipment data come from?*
  - *How do you keep it accurate?*
  - *Why not just use Google Maps?*
  - *How would this scale?*
- [ ] Rehearse at least twice with a timer

**Decisions**
- [ ] **Live demo or recorded video** as the main demo
- [ ] **Who presents** and who drives the phone

**Done when:** rehearsed within the time limit, with the backup recording ready.

---

## Decision log

| Step | Decision | Choice | Why |
|---|---|---|---|
| 1 | Name | CareFit | Simple; "Level" could be misread |
| 1 | Scope | | |
| 1 | Clinic data (real vs fictional) | Fictional; no Demo data label (screens stay as designed) | No false equipment claims about real businesses |
| 1 | Demo area | Oakland, ZIP 94612 | Matches the mockups |
| 2 | Design models | Opus only | No time to run and compare two models |
| 2 | Output format | HTML/CSS per screen + board | Easiest to build from and to hand-edit |
| 2 | Navigation pattern | Bottom tabs (Find · Ask · Profile) + linear onboarding | Three top-level areas; onboarding runs once |
| 2 | Base design | n/a | Single model |
| 2 | Themes | Light only, semantic tokens | Dark/high-contrast stays an optional feature |
| 3 | Framework | Vite + React | Harness writes it reliably |
| 3 | Language | TypeScript | Shared shapes across four parallel workers |
| 3 | CSS approach | Plain CSS (master tokens + components) | Already built and checked |
| 3 | Host | Loukik's Mac + Tailscale Funnel | Ollama is local; stable HTTPS URL for the PWA |
| 3 | LLM provider and model | Local Ollama; model tag TBD at install | No hosted LLM or keys |
| 3 | Setup + worker model | Sonnet 5.5 (`claude-sonnet-5-5`); planner Opus 5.5 | Plan pins the contracts, so setup is mostly execution |
| 4 | Chunk order / parallel | Setup builds shared chunks; 4 parallel workers | Screens don't overlap |
| 4 | Match scoring rules | Mockup tiers; patient-reported = Has; Poor ranked, not excluded | Screens 05, 07, 08 already show them |
| 4 | Seed clinic count | About 20 | Fills the map; checkable by hand |
| 4 | Who runs the workers | Loukik's Mac; Opus orchestrator via `RUN.md`; A/B/D GPT Sol, C Sonnet 5.5; pushes to `main` | Tharak's machine lacked Node; mixes both harnesses |
| 4 | Onboarding | Deferred during the run; now in progress in a separate session | Built after the four workers merged |
| 4 | Report a gap (optional) | In progress in a separate session | |
| 5 | Step 5 scope | Manual testing only, then submit | `npm run check` already covers the automated checks |
| 5 | Minimum Lighthouse score | | |
| 5 | What gets cut | | |
| 6 | Live or video | | |
| 6 | Presenter / driver | | |
