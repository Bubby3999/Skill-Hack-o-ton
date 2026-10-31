# Worker C · Find + Results (04, 05, 06, 07)

Run: unattended, through `RUN.md`. Model: Sonnet 5.5. Read in order: `CLAUDE.md`, this file, `plans/STEP-3-SETUP.md` (contracts, match rules, and your section under "Worker scopes"), then your screens in `design/master/screens/`. Follow CLAUDE.md's Code steps: plan the edits (Step 1) and put the plan in your handoff, then implement (Step 2) without waiting. Load the `ponytail` and `ui-ux-pro-max` skills.

## Screens
04 Find, 05 Results list, 06 Results map, 07 Empty results. Mockups: `design/master/screens/04-find.html`, `05-results-list.html`, `06-results-map.html`, `07-results-empty.html`.

## Routes (already wired; the shell owns `src/routes.tsx`)
| Route | Screen | File |
|---|---|---|
| `/find` | 04 | `src/screens/find/FindScreen.tsx` |
| `/results` | 05 list, or 07 as a state of the same route | `src/screens/find/ResultsScreen.tsx` |
| `/results/map` | 06 | `src/screens/find/MapScreen.tsx` |

## Editable paths (yours only)
- `src/screens/find/**` (replace `FindScreen.tsx`, `ResultsScreen.tsx`, `MapScreen.tsx`; add files and CSS here; Leaflet CSS is imported from here)
- `tests/e2e/screens/c/**`

## Scope
Results are driven by URL search params through `filtersToQuery` / `queryToFilters` (base: `defaultFilters(profile, care)`), so the assistant (Worker D) and Find produce the same list from the same filters. `searchClinics(filters, CLINICS)` does the ranking and returns `{ items, goodCount, emptyReason }`.
- **Find (04):**
  - location summary (links to `locationEditPath('/find')`), type of care (text input plus chips: Primary care, OB-GYN, Imaging, Urgent care), needs summary (Edit links to `/profile`), "Show matches" (goes to `/results?...`), and a way into Ask (`/ask`)
  - with no location set, it asks for one
  - the care input accepts free text (`normalizeCare` handles OB-GYN, "ob gyn", Gynecology, etc.)
- **List (05):**
  - rank and `ClinicCard` for each item; sort (Best match / Nearest); filters (type, radius, needs). Filters apply to this search only; the profile is unchanged.
  - list/map toggle (links between `/results` and `/results/map`, keeping the query string)
  - count changes are announced in a live region (`role="status"`, e.g. "4 clinics within 15 mi · best match first")
  - Poor fits are included in the list.
- **Map (06):**
  - Leaflet + OpenStreetMap tiles with the visible attribution "© OpenStreetMap contributors"; no tile prefetching or caching
  - numbered markers are `<button>`s (Leaflet `divIcon` using the `.pin` markup from the mockup): `aria-label` has the rank, name, fit, and distance ("1, Lakeshore Women's Health, strong fit, 4.8 miles"); `aria-pressed` on the selected one; the user's location dot
  - a bottom sheet with Prev/Next buttons (the non-drag alternative) showing `ClinicCard variant="compact" as="h3"`
  - rank numbers match the list for the same sort
- **Empty state (07):**
  - shown when `emptyReason` is `no-match` (clinics in range, none Strong or Possible): "No full matches within N mi", "M <care> centers nearby are missing a required need: <names>"; buttons: widen the radius (next step: 5 to 15 to 25 to 50), "Show the M partial matches" (shows the Poor fits in the list), and Ask for help
  - when `emptyReason` is `none-in-range`: say no clinic of that type is in range and offer to widen the radius
- Accepts filters from the assistant via the same query string.

## Done when
- Changing a need on Profile changes the results.
- Filters coming from Ask give the same list as the same manual filters (same URL, same order).
- Maya at OB-GYN within 15 mi shows Lakeshore (Strong, 5 of 6), Fruitvale (Possible, 4 of 6), Bayview (Possible, 3 of 6), Grand Avenue (Poor, 2 of 6), in that order, with the distances in the mockup.
- Imaging within 5 mi shows the empty state with 2 partial matches; widening to 15 mi lists clinics.
- The map markers are keyboard-operable buttons and match the list ranks.
- Keyboard only: Find, list, map, and the empty-state actions.

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
- The AI mode is `mock`. Ollama is not installed on this machine. Don't call it.
- Tests: unit tests go next to your code (`*.test.ts(x)`, run by Vitest in node, no DOM; test pure logic). Browser tests go in your `tests/e2e/screens/<letter>/` folder; use `tests/e2e/helpers.ts` (`openRoute`, `expectNoSeriousAxeIssues`). Clinic "open now" text depends on the day: don't assert it.
- The shared smoke test (`tests/e2e/smoke.spec.ts`) loads every route with axe. Your screens must keep passing it: one `h1`, labeled controls, 44x44px targets, visible focus, text for every status.
- If something is unclear, take the reading closest to the mockup and the plan, and list it under "Decisions I made".

## Before you finish
1. `npm ci && npx playwright install chromium` if `node_modules` is missing (worktrees don't share it).
2. `npm run check` must pass. It runs typecheck, unit tests, and the Playwright/axe smoke test on a production build.
3. Go through "Done when" yourself, including using your screens with the keyboard only.
4. Commit everything on your branch as `Step 4 · Worker X: <summary>`. Don't push.
5. End with the handoff format from `RUN.md`.
