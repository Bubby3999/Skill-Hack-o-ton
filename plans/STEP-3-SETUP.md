# Step 3 — Setup plan

Planner: Opus 5.5 · Setup agent: Sonnet 5.5 (`claude-sonnet-5-5`), one session on Loukik's Claude harness · 2026-10-31

**Setup agent:** your role is Code Agent (`AGENTS.md`): load `ponytail`, plus `ui-ux-pro-max` for the shell and shared components. Read `PROJECT.md`, `design/BRIEF.md`, and `design/master/README.md` first. Follow the Code steps in `CLAUDE.md`: Step 1 plans the code edits and goes to the user for review; Step 2 implements them. Report any conflict with this plan before writing code.

## Locked decisions

| Topic | Choice | Why |
|---|---|---|
| Stack | Vite + React + TypeScript | The harness writes it reliably; types protect the shapes shared by four parallel workers |
| CSS | Port `design/master/tokens.css` + `components.css` as the global styles | Already contrast-checked and axe-tested |
| Icons / font | `lucide-react` (same names as `icons.js`); self-hosted Atkinson Hyperlegible Next | The PWA works offline; no Google Fonts at runtime |
| Server | One small Node server serves the built app and `/api/*` on one port | Same origin: no CORS, one HTTPS URL |
| Host | Loukik's Mac | Ollama runs there; a serverless host can't reach a laptop |
| HTTPS | Tailscale Funnel | Stable URL, so the installed PWA survives restarts; no interstitial page |
| AI | Local Ollama behind `/api/chat`, with an explicit mock mode | No hosted LLM, no API keys |
| Clinic data | ~20 fictional clinics in Oakland. No "Demo data" label; screens stay as designed | No false equipment claims about real businesses |
| Demo area | Oakland, default ZIP 94612 | Matches the mockups |
| Scoring | The rules drawn in the mockups (§7) | Screens 05, 07, and 08 already show them |
| Match engine | Built in setup, not by a worker | Workers B, C, and D all use it |
| Workers | 4 × Sonnet 5.5 on Tharak's machine, started by an Opus orchestrator from `RUN.md` | Screens don't overlap; the orchestrator merges and pushes to `main` |
| Onboarding | Deferred (build if time). The app starts with the demo profile | Keeps the demo path short |

## What setup delivers

### 1. Runs locally
- Install is reproducible from the committed lockfile (Node 24).
- **Dev:** one command runs the app with hot reload, with `/api` working.
- **Prod:** build, then the Node server serves `dist/` and `/api` on one port.
- **Check:** one command runs typecheck, unit tests, and the Playwright/axe smoke test.
- Starts cleanly with an empty `OLLAMA_MODEL`; missing env never crashes it.
- Build and test output (`dist/`, Playwright reports, test results) is gitignored.

### 2. App shell
- A route for each MVP screen 01–12. Placeholder content names the screen and its worker. No route for 13 yet.
- Bottom tabs Find · Ask · Profile. Onboarding (01–03) has no tabs.
- Skip link, `header`/`main`/`nav` landmarks, one `h1` per screen. Focus moves to `#main` on every route change.
- No profile, or missing or corrupted storage → load the **demo profile** and open Find. No crash.
- Route 01 stays a placeholder, because onboarding is deferred.
- Screens 02 and 03 are **edit screens**, opened from Profile (needs, location) and from Find ("Change location"). They have no step progress and no skip. Worker A builds them; the shell provides the entry points.

### 3. Shared components
Components used by two or more workers. Build them as React components that match the markup and states in `components.html`:
app bar, back link, bottom nav, sticky dock, buttons (all variants), icon button, chip, tag, notice, status line, list row / link card, fit badge, fit meter, reasons list, clinic card.

A component used by only one worker stays with that worker:
- dialog → A
- feature row, feature status → B
- toolbar, view toggle, map, bottom sheet → C
- chat bubbles, mini results, composer → D

### 4. Contracts
One module that every worker imports.
- **Access features:** the 19 keys, full and short labels, and 4 categories from `design/BRIEF.md`. This is the canonical list.
- **Feature status:** `verified` · `patient-reported` · `unknown` · `not-available`.
- **Profile** (PROJECT.md #1):
  - needs `{ key, priority: required | nice }`
  - location `{ source: gps | zip, zip?, lat, lng, label }`
  - radius: 5, 10, 15, 25, or 50 mi
  - letter details (name, email, phone; all optional)
  - add an onboarding state when onboarding ships
- **Clinic** (PROJECT.md #3). `doctors[].npi` is optional and left out of demo data, because invented NPIs could match real ones.
- **Search filters:** type of care, radius, needs with priorities, sort, location. Find, Results, and the assistant all use this one shape.
- **Match result:** `{ score, tier, has[], unknown[], missing[], distance }` (PROJECT.md #4, plus `tier`).
- **Letter draft:** clinic, appointment date, doctor, accommodations, notes, letter details, updated time.
- **Assistant:**
  - request `{ messages, needs, zip?, radius }`
  - response `{ reply, filters?, clinicIds?, mode: live | mock }`, or a typed error that the UI uses to fall back

### 5. Storage
- All `localStorage` access goes through one module: get / set / remove / clear, safe JSON parsing, a schema-version key. A version mismatch or bad JSON counts as empty.
- **Reset demo** clears every CareFit key, then reloads the demo profile.
- **Demo profile:** Maya from `design/BRIEF.md`. Three required and three nice-to-have needs, ZIP 94612, 15 mi, and the letter details shown on screen 12.

### 6. Geo
- **Distance:** haversine, in miles, rounded to one decimal.
- **Geolocation wrapper:** returns coordinates, or a typed reason (denied / unavailable / timeout).
- **ZIP lookup:** a bundled table of centroids for Oakland and neighboring ZIPs, taken from the Census ZCTA Gazetteer file. A ZIP outside the table shows a clear "This demo covers Oakland-area ZIPs" error; there is no silent default.

### 7. Match engine
A pure function with unit tests.

**Each need, for one clinic:**
- `verified` or `patient-reported` → **Has**
- `unknown`, or the key is missing from the clinic → **Unknown**
- `not-available` → **Missing**

**Tier** (always shown with "N of M needs"):
- **Strong fit:** every required need is Has.
- **Possible fit:** no required need is Missing, and at least one is Unknown.
- **Poor fit:** at least one required need is Missing.
- If the profile has no required needs, there is no tier; cards show only the count.
- If the profile has no needs at all, there is no tier and no count; cards link to adding needs.

**Score and ordering:**
- `score` = needs met ÷ total needs.
- Inside `has`, `unknown`, and `missing`, required needs come first, then the rest in profile order.

**Results:**
- Clinics outside the radius, or without the type of care in `specialties[]`, are excluded. Everything else is listed, including Poor fits.
- **Best match** sorts by tier → needs met → distance. **Nearest** sorts by distance → tier.
- **Empty state (07)** appears when no Strong or Possible clinic is in range. It offers: widen the radius, show the partial (Poor) matches, or Ask. If no clinic of that type is in range at all, it says so and offers to widen the radius.
- The assistant's top matches (11) show Strong and Possible fits only.

**Tests:**
- Maya (persona in BRIEF) against the four OB-GYN clinics in 05, plus the imaging case in 07.
- Edge cases: no needs, only nice-to-haves, a key missing from the clinic, tied distances, a clinic exactly on the radius.

### 8. Clinic dataset
- About 20 fictional clinics across Oakland. Every type (clinic, hospital, urgent care, imaging) appears. Every clinic lists at least one of the Find specialties (Primary care, OB-GYN, Imaging, Urgent care).
- **It must reproduce the mockups:**
  - the four OB-GYN clinics in 05, with their distances from the 94612 centroid (±0.1 mi) and their statuses for Maya's needs
  - Lakeshore's full checklist in 08
  - two imaging centers within 5 mi that have no wheelchair-accessible scale (07)
- Statuses are mixed across all 19 keys. `lastVerified` dates fall in 2026, before Oct 31. Sources are plain: "Clinic phone call", "Site visit", "Clinic website", "N patient reports".
- Clinic and doctor names are fictional. Phones use (510) 555-01xx, websites use `example.org`, and every clinic has `isDemo: true`. Street names can be real Oakland streets, but never a real clinic's name or address.
- A validation test checks that every clinic has coordinates, valid keys and statuses, and a specialty.

### 9. Server and `/api/chat`
- Reads `.env`: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, a port, and the AI mode `live | mock`. Add all of them to `.env.example`, with the mode defaulting to `mock` so a fresh checkout works.
- `GET /api/health` reports the mode, the configured model, and whether Ollama answers.
- `POST /api/chat` validates the request (size cap, message-count cap) and returns the assistant contract.
  - **Mock mode** returns fixed replies. The demo query *"OB-GYN within 15 miles who can weigh me seated"* must come back as OB-GYN, 15 mi, wheelchair-accessible scale required.
  - **Live mode** forwards to Ollama `POST /api/chat` without streaming, with a JSON-schema `format`. It validates the output and returns a typed error on timeout, bad JSON, Ollama being down, or a missing model.
- The mode is always set explicitly; live mode never falls back to mock on its own.
- The browser never calls Ollama directly.
- Worker D owns the system prompt, filter-schema details, clinic questions, and answer quality. Setup ships the plumbing and the mock.

### 10. PWA
- **Manifest:** name and short name CareFit, 192 / 512 / maskable icons from the brand mark, theme color from the tokens, `display: standalone`.
- **Service worker:** precaches the app shell, font, and clinic data. It never caches `/api` and never prefetches map tiles (OSM tile policy).
- Setup only confirms the production build is installable. Offline behavior is checked in Step 4.

### 11. Tests and tooling
- **Vitest:** match engine, storage, distance, ZIP lookup, dataset validation, `/api/chat` request and response validation.
- **Playwright + `@axe-core/playwright`:** every route loads at 390×844 with 0 serious or critical axe issues, and the keyboard can reach every route.

### 12. Docs and harness
- **README:** install, env, dev, build, start, check; mock vs live; installing Ollama and pulling a model; Tailscale Funnel (one-time login, then the serve command).
- **`CLAUDE.md`:** the project rules from STEP-PLAN 3.3, with real paths.
- **`AGENTS.md`:** the lineup:
  - Planner: Opus 5.5
  - Setup: Sonnet 5.5, on Loukik's Mac
  - Orchestrator: Opus 5.5, on Tharak's machine, running `RUN.md`
  - Workers A–D: Sonnet 5.5, on Tharak's machine
- **Worker packets** `plans/tasks/A.md`–`D.md`: the scope from the next section, plus editable paths, read-only shared paths, dependencies, and the check command. Workers run unattended (see `RUN.md`), so each packet must be self-contained: nothing in it should need a human answer. The handoff format is the one in `RUN.md`.

## Worker scopes (Step 4)
All four workers run on Tharak's machine, unattended, through `RUN.md`. Workers edit only their own screens. Shared code (routing, shared components, contracts, storage, geo, match, server plumbing, dependencies, config) is read-only for them. They work around a gap inside their own paths and list it in the handoff. The orchestrator logs these in `plans/RUN-LOG.md`, and Loukik picks them up after pulling.

### A · Profile + needs and location editors (02, 03, 12)
Onboarding (01 Welcome, step progress, skip/resume) is deferred and not part of this scope.
- **Needs editor (02):** checkboxes grouped by category. Each checked need gets Required / Nice to have, defaulting to Required.
- **Location editor (03):** GPS after a permission prompt; if denied, a ZIP field that explains why. ZIP is checked against the demo table. Radius 5–50 mi.
- **02 and 03:** use the mockup layouts without the step progress and skip. They have Back and Save, and Save returns to the screen the user came from.
- **Profile (12):** needs, location, letter details, saved letters (→ 10), and **Reset demo**.
  - Reset has a confirm dialog and restores the demo profile.
  - Copy: "Clears your letters and reports and restores the demo profile." Dialog: "Reset the demo? Your needs, location, letters, and reports go back to the demo profile. This can't be undone."
- **Done when:**
  - edits survive a reload
  - Reset restores the demo profile
  - denied location falls back to ZIP
  - Save on 02 and 03 returns to the screen the user came from

### B · Clinic detail + letters (08, 09, 10)
- **Detail:**
  - every clinic field
  - tap-to-call, a directions link (by coordinates), and the website
  - fit summary from the match engine
  - checklist of the user's needs (required, then nice) with status, date, and source
  - other features collapsed; doctors; hours
  - Hide "Report a gap" unless screen 13 ships.
- **Form:**
  - prefilled from the profile and the clinic
  - an accommodation is checked when the clinic's status is Unknown or Missing, unchecked when Has
  - every field is editable
  - real labels, `fieldset`/`legend`, and errors announced to screen readers
- **Letter:**
  - the template in 10, citing Section 504 / ADA in general terms, marked "Not legal advice"
  - Copy, Share (falls back to Copy), Email (`mailto:`), Print / PDF
  - drafts save automatically and appear on Profile
- **Done when:**
  - a letter is 2 taps from detail
  - every clinic field renders
  - statuses are announced as text

### C · Find + Results (04, 05, 06, 07)
- **Find:**
  - location summary (→ 03 in edit mode), type of care, needs summary (→ Profile), Show matches, a way into Ask
  - with no location set, it asks for one
- **List:**
  - rank and clinic card
  - sort (best match / nearest)
  - filters (type, radius, needs). Filters apply to this search only; the profile is unchanged.
  - list/map toggle
  - count changes are announced in a live region
- **Map:**
  - Leaflet + OSM with attribution
  - numbered markers are buttons: name, fit, and distance in `aria-label`; `aria-pressed` on the selected one
  - a bottom sheet with Prev/Next
  - rank numbers match the list
- **Empty state:** per §7.
- Accepts filters from the assistant through the shared filter shape.
- **Done when:**
  - changing a need on Profile changes the results
  - filters from Ask give the same list as the same manual filters

### D · Assistant (11)
- **Chat UI:**
  - messages in a `role="log"` region; composer; suggestion chips
  - the applied filters shown as chips
  - top matches (Strong and Possible) link to clinic detail
  - See results / Change filters
- **System prompt:**
  - the assistant's role and the profile parts it receives
  - filters returned as structured JSON
  - clinic questions answered only from clinic data, saying "unknown" when the data says unknown
  - no medical advice
- **Sends:** messages, needs, ZIP if set, radius. **Never sends:** name, email, phone, GPS coordinates.
- **Privacy notice** (replaces the mockup's "AI service" line): *"Your messages, access needs, and ZIP code go to CareFit's demo server, where a local AI model runs the search. They aren't sent to an AI company. Your name and contact details are not sent. No medical advice."*
- **Failure:** if Ollama is down, slow (timeout), or returns invalid output, show an error bubble and a link to manual filters.
- **Done when** (on Tharak's machine, which has no Ollama):
  - the demo query returns correctly filtered results in mock mode
  - live mode with Ollama unreachable shows the fallback
  - the live-model test happens on Loukik's Mac after pulling

**Handoff from every worker:** the format in `RUN.md`. The orchestrator labels these claims as worker-reported.

## Direction and watch-outs
- `design/master/` is the visual spec and stays read-only. To change a value, edit the ported tokens, never one screen.
- The mockups load the font from Google Fonts and the icons from `icons.js`; neither ships.
- The map pin positions in 06 are placeholder art; Leaflet replaces them.
- `.env` is untracked and has an empty `OLLAMA_MODEL`. Ollama isn't installed on Loukik's Mac yet, so setup must work without it.
- `origin/main` and `origin/tharak` are two commits behind `loukik`. Merge to `main` before setup starts. Setup commits land on `main`, and every worker branch starts from the setup commit.
- `localhost` covers dev. The phone needs the Funnel URL for geolocation, the service worker, clipboard, and install.
- This is a demo server: no auth or rate limiting, but request size and message count are capped.

## Out of scope
- Screen behavior beyond placeholders (that's the Step 4 workers).
- The onboarding flow (01 Welcome, step progress, skip/resume): build it later if there's time.
- Screen 13 and every optional feature.
- Dark / high-contrast theme.
- Real clinic data, the NPI Registry, and the Census Geocoder; fictional data needs none of them.
- Hosted deploys, serverless functions, hosted LLMs, API keys.

## Setup is done when
- A fresh clone with `.env` copied from the template can install, dev, build, start, and check, all successfully.
- Every route is reachable by keyboard, focus moves to `#main` on navigation, and the axe smoke test passes.
- `/api/health` and `/api/chat` answer in mock mode. Live mode returns a typed error while Ollama is missing.
- Match-engine tests reproduce the mockup tiers and counts, and dataset validation passes.
- Empty storage loads the demo profile.
- The production build is installable (manifest and service worker present).
- Packets A–D are written, and everything is pushed to `main`.

## User actions
These run alongside setup or right after it.
- Install Ollama on Loukik's Mac, pull an 8B-class instruct model (the Mac is an M2 with 16 GB), and set `OLLAMA_MODEL`.
- Install Tailscale on the Mac, log in, and enable Funnel for the tailnet.
- After handoff: install the PWA on a phone through the Funnel URL, and test `/api/chat` live once Ollama is installed.
- Once setup lands, Tharak pulls `main` and starts `RUN.md` (`Orchestrate RUN.md` in Claude Code on Opus 5.5). The team pulls when it finishes.
