# Worker A · Profile + needs and location editors (02, 03, 12)

Run: unattended, through `RUN.md`, on Loukik's Mac. Model: GPT Sol (`gpt-6.1-sol`, Codex CLI). Read in order: `CLAUDE.md`, this file, `plans/STEP-3-SETUP.md` (contracts, match rules, and your section under "Worker scopes"), then your screens in `design/master/screens/`. Follow CLAUDE.md's Code steps: plan the edits (Step 1) and put the plan in your handoff, then implement (Step 2) without waiting. Load the `ponytail` and `ui-ux-pro-max` skills.

## Screens
02 Needs and 03 Location as edit screens, 12 Profile. Mockups: `design/master/screens/02-needs.html`, `03-location.html`, `12-profile.html`.

## Routes (already wired; the shell owns `src/routes.tsx`)
| Route | Screen | File |
|---|---|---|
| `/profile` | 12 Profile | `src/screens/profile/ProfileScreen.tsx` |
| `/profile/needs?from=<path>` | 02 as an edit screen | `src/screens/profile/NeedsEditScreen.tsx` |
| `/profile/location?from=<path>` | 03 as an edit screen | `src/screens/profile/LocationEditScreen.tsx` |

## Editable paths (yours only)
- `src/screens/profile/**` (replace the three placeholder files: `ProfileScreen.tsx`, `NeedsEditScreen.tsx`, `LocationEditScreen.tsx`; add files and CSS here)
- `tests/e2e/screens/a/**`

## Scope
Onboarding (01 Welcome, step progress, skip/resume) is deferred and not part of this scope.
- **Needs editor (02):** checkboxes grouped by category (Mobility, Communication, Sensory & cognitive, Other; use `CATEGORIES` and `FEATURES`). Each checked need gets Required / Nice to have, defaulting to Required. Saves to the profile via `useProfile().setProfile`.
- **Location editor (03):** "Use my current location" calls `getPosition()` after the browser's permission prompt. If denied or unavailable, show the ZIP field with a plain explanation of why. A ZIP is checked with `lookupZip`; show its error message ("This demo covers Oakland-area ZIPs.") when it fails; never default silently. GPS location is stored as `{ source: 'gps', label: 'Current location', lat, lng }`; a ZIP as `{ source: 'zip', zip, label: 'ZIP 94612', lat, lng }`. Radius 5, 10, 15, 25 or 50 mi.
- **02 and 03:** use the mockup layouts **without** the step progress and the skip. They have Back and Save. Back and Save both return to the path in `?from=` via `useReturnTo('/profile')` (already sanitized). Find (Worker C) and Profile link here with `needsEditPath(from)` / `locationEditPath(from)`; use those helpers for your own Profile links too (`from` = `/profile`).
- **Profile (12):** needs (required and nice tags), location with radius, letter details (name, email, phone: editable inline or in a simple form; all optional), saved letters from `listDrafts()` (each links to `/clinic/<clinicId>/letter`; show a short empty state when there are none), the privacy notice, and **Reset demo**.
  - Reset has a confirm dialog (native `<dialog>`, markup in `components.html`) and calls `useProfile().resetDemo()`.
  - Copy under the button: "Clears your letters and reports and restores the demo profile." Dialog: "Reset the demo? Your needs, location, letters, and reports go back to the demo profile. This can't be undone."
  - Dialog behavior: opens focused on Cancel, Esc closes and returns focus to the trigger.

## Done when
- Edits to needs, location, radius, and letter details survive a reload.
- Reset demo restores Maya's profile (6 needs, ZIP 94612, 15 mi) and clears saved letters.
- Denied or unavailable location falls back to the ZIP field with an explanation.
- A bad or out-of-area ZIP shows a clear error and does not change the profile.
- Save and Back on 02 and 03 return to the screen the user came from (`?from=`), and fall back to `/profile` when it is missing or unsafe.
- Changing a need on Profile changes Worker C's results (they read the same profile).
- Keyboard only: every control reachable, dialog focus handled.

## Read-only for you
`src/{contracts,lib,data,components,shell,styles}/**`, `src/{routes,App,main}.tsx`, `server/**` (except `server/assistant/**` for Worker D), `tests/e2e/{smoke,pwa}.spec.ts`, `tests/e2e/{helpers,routes}.ts`, `tests/unit/**`, `public/**`, `package.json`, the lockfile, all config files, `design/**`, `plans/**`, and the root docs. Other workers' folders are theirs: A `src/screens/profile`, B `src/screens/clinic`, C `src/screens/find`, D `src/screens/ask` and `server/assistant`.

## Shared code you can use (read-only)
- `src/components`: `Screen` (wrap every screen: header, `<main id="main">`, dock, document title; focus moves to `#main` on route change), `AppBar`/`BackLink`, `Button` (variants, `to`/`href`), `IconButton`, `Chip`, `Tag`, `Notice`, `StatusLine`, `ListRow`, `FitBadge`, `FitMeter`, `FitMeterGroups`, `Reasons`, `ClinicCard`, `Dock`/`ActionBar`/`BottomNav`, `Icon` (typed names). Markup and classes match `design/master/components.html`.
- `src/contracts`: feature keys, labels (`FEATURES`), `STATUS_LABEL`, `Profile`, `Clinic`, `SearchFilters`, `MatchResult`, `LetterDraft`, assistant types, `buildChatRequest`.
- `src/lib`: `match` (`matchClinic`, `searchClinics`, `normalizeCare`), `filters` (`defaultFilters`, `filtersToQuery`, `queryToFilters`, `applyAssistantFilters`), `returnTo` (`needsEditPath`, `locationEditPath`, `useReturnTo`), `geo` (`distanceMiles`, `getPosition`), `zips` (`lookupZip`), `hours` (`openLabel`, `groupHours`, `formatTime`), `profile`, `drafts`, `storage`.
- `src/shell/ProfileProvider`: `useProfile()` gives `{ profile, setProfile, resetDemo }`. Missing or corrupted storage already loads the demo profile (Maya).
- `src/data`: `CLINICS`, `clinicById`, `DEMO_PROFILE`.
- Styles: `src/styles/tokens.css` and `components.css` are global. Put screen-specific CSS in a `.css` file inside your own folder, use tokens only (no raw hex or px colors), and import it from your screen.
- Match rules (tiers, Has/Unknown/Missing, ordering, empty state): `plans/STEP-3-SETUP.md` section 7. The engine is already built and tested; call it, don't re-implement it.

## Rules for this run (unattended; see RUN.md)
- Edit only the "Editable paths" above. Everything else is read-only, including `package.json`, the lockfile, `src/routes.tsx`, config, `design/`, and `plans/`.
- Don't add dependencies. Leaflet, react-leaflet, lucide-react, and react-router-dom are already installed.
- If a read-only file blocks you, work around it inside your own paths and list it under "Integration needs" in your handoff.
- The AI mode is `mock`. Don't call Ollama or switch to live mode during this run.
- Tests: unit tests go next to your code (`*.test.ts(x)`, run by Vitest in node, no DOM; test pure logic). Browser tests go in your `tests/e2e/screens/<letter>/` folder; use `tests/e2e/helpers.ts` (`openRoute`, `expectNoSeriousAxeIssues`). Clinic "open now" text depends on the day: don't assert it.
- The shared smoke test (`tests/e2e/smoke.spec.ts`) loads every route with axe. Your screens must keep passing it: one `h1`, labeled controls, 44x44px targets, visible focus, text for every status.
- If something is unclear, take the reading closest to the mockup and the plan, and list it under "Decisions I made".

## Before you finish
1. `npm ci && npx playwright install chromium` if `node_modules` is missing (worktrees don't share it).
2. `npm run check` must pass. It runs typecheck, unit tests, and the Playwright/axe smoke test on a production build.
3. Go through "Done when" yourself, including using your screens with the keyboard only.
4. Commit everything on your branch as `Step 4 · Worker X: <summary>`. Don't push.
5. End with the handoff format from `RUN.md`.
