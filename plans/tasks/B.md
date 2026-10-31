# Worker B · Clinic detail + letters (08, 09, 10)

Run: unattended, through `RUN.md`. Model: Sonnet 5.5. Read in order: `CLAUDE.md`, this file, `plans/STEP-3-SETUP.md` (contracts, match rules, and your section under "Worker scopes"), then your screens in `design/master/screens/`. Follow CLAUDE.md's Code steps: plan the edits (Step 1) and put the plan in your handoff, then implement (Step 2) without waiting. Load the `ponytail` and `ui-ux-pro-max` skills.

## Screens
08 Clinic detail, 09 Request form, 10 Letter preview. Mockups: `design/master/screens/08-clinic-detail.html`, `09-request-form.html`, `10-letter-preview.html`.

## Routes (already wired; the shell owns `src/routes.tsx`)
| Route | Screen | File |
|---|---|---|
| `/clinic/:id` | 08 | `src/screens/clinic/ClinicDetailScreen.tsx` |
| `/clinic/:id/request` | 09 | `src/screens/clinic/RequestFormScreen.tsx` |
| `/clinic/:id/letter` | 10 (one draft per clinic, keyed by clinic id) | `src/screens/clinic/LetterScreen.tsx` |

## Editable paths (yours only)
- `src/screens/clinic/**` (replace `ClinicDetailScreen.tsx`, `RequestFormScreen.tsx`, `LetterScreen.tsx`; add files and CSS here; the letter template belongs here too, e.g. `letter.ts` with a unit test)
- `tests/e2e/screens/b/**`

## Scope
- **Detail (08):**
  - every clinic field: name, type, specialties, address, distance from the profile location (`matchClinic(...).distance`), hours (`groupHours` and `openLabel`), phone, website, doctors
  - tap-to-call (`tel:`), a directions link built from the clinic's coordinates (an OpenStreetMap or maps URL), and the website
  - fit summary from the match engine: tier badge, count, `FitMeterGroups`, and the sentence under it (all required met, nice-to-haves met, which are unknown)
  - checklist of the user's needs (required first, then nice) with status, date, and source (new feature-row component of your own: status text with icon, "Verified", "Patient-reported", "Unknown", "Not available")
  - other access features in a collapsed `<details class="group">`; render the count from the data (a key the clinic lacks is "Unknown, no information yet")
  - an unknown clinic id shows a clear not-found state with a link to Find
  - Hide "Report a gap" (screen 13 is not in this run).
- **Form (09):**
  - prefilled from the profile letter details and the clinic; every field editable
  - appointment date, doctor (select from the clinic's doctors, or free text), accommodations as a checkbox group: checked when the clinic's status is Unknown or Missing, unchecked when Has; start from the user's needs, but list every feature the user marked
  - notes; real `<label>`s, `fieldset`/`legend`, errors announced to screen readers (`role="alert"` or `aria-live`), `aria-invalid` on bad fields
  - "Preview letter" goes to `/clinic/:id/letter`; the draft is saved on the way
- **Letter (10):**
  - the template in the mockup: cites Section 504 / ADA in general terms and is marked "Not legal advice"
  - Copy (`navigator.clipboard`), Share (`navigator.share`, falls back to Copy), Email (`mailto:` with subject and body), Print / PDF (`window.print()`; add a print stylesheet in your folder)
  - drafts save automatically with `saveDraft` (shared `LetterDraft` contract) and show "Draft saved" in a status line; they appear on Profile (Worker A reads `listDrafts()`)
  - "Edit request" goes back to the form with the draft values restored

## Done when
- A letter is 2 taps from the clinic detail (Request accommodations, then Preview letter).
- Every clinic field renders on the detail screen.
- Statuses are announced as text (icon plus word), never by color alone.
- Lakeshore's detail reproduces screen 08 (checklist statuses, dates, sources, 3 doctors, hours).
- Drafts survive a reload and the form restores them.
- Copy, Share fallback, Email, and Print all work in a Chromium test where testable (Copy and the `mailto:` href).
- Keyboard only: the whole flow from detail to letter.

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
