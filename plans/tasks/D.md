# Worker D · Assistant (11)

Run: unattended, through `RUN.md`. Model: Sonnet 5.5. Read in order: `CLAUDE.md`, this file, `plans/STEP-3-SETUP.md` (contracts, match rules, and your section under "Worker scopes"), then your screens in `design/master/screens/`. Follow CLAUDE.md's Code steps: plan the edits (Step 1) and put the plan in your handoff, then implement (Step 2) without waiting. Load the `ponytail` and `ui-ux-pro-max` skills.

## Screens
11 Ask. Mockup: `design/master/screens/11-assistant.html`.

## Routes (already wired; the shell owns `src/routes.tsx`)
| Route | Screen | File |
|---|---|---|
| `/ask` | 11 | `src/screens/ask/AskScreen.tsx` |

## Editable paths (yours only)
- `src/screens/ask/**` (replace `AskScreen.tsx`; add files, CSS, and the `/api/chat` fetch client here)
- `server/assistant/**` (`prompt.ts`: system prompt, `RESPONSE_SCHEMA`, `buildMessages`; `mock.ts`: the mock-mode replies; unit tests for both)
- `tests/e2e/screens/d/**`

## Scope
The server plumbing is already built and read-only: `server/api.ts`, `chat.ts`, `ollama.ts`, `config.ts`, and `src/contracts/assistant.ts` (request and response types, validators, `buildChatRequest`). You own the screen, the prompt, and the mock replies. Your prompt and schema must keep producing output that `parseModelOutput` accepts (filters limited to `care`, `radius`, `needs`).
- **Chat UI:**
  - messages in a `role="log"` region with `aria-live="polite"`; composer with a labeled textarea and a Send button; suggestion chips ("Which of these have a patient lift?", "Is Lakeshore's scale verified?")
  - the applied filters shown as chips ("OB-GYN", "Within 15 mi", "Wheelchair scale · required", "+ N needs from your profile"); merge with `applyAssistantFilters(defaultFilters(profile), response.filters)`
  - top matches (Strong and Possible fits only, from `searchClinics`) as `mini-results` linking to `/clinic/:id`
  - "See results" goes to `/results?` + `filtersToQuery(merged)`; "Change filters" goes to `/find`
  - a loading state while waiting (model calls can take 30 s on a cold start)
- **Request:** build it only with `buildChatRequest(profile, messages)`: messages, needs, ZIP if set, radius. Never name, email, phone, or GPS coordinates. Keep to the last 20 messages.
- **Privacy notice** (replaces the mockup's "AI service" line): "Your messages, access needs, and ZIP code go to CareFit's demo server, where a local AI model runs the search. They aren't sent to an AI company. Your name and contact details are not sent. No medical advice."
- **System prompt (`server/assistant/prompt.ts`):** the assistant's role; the profile parts it receives; filters returned as structured JSON; clinic questions answered only from clinic data (add the relevant clinic data to `buildMessages`), saying "unknown" when the data says unknown; no medical advice.
- **Mock (`server/assistant/mock.ts`):** keep the demo query "OB-GYN within 15 miles who can weigh me seated" returning `care: OB-GYN`, `radius: 15`, `needs: [{ key: 'scale', priority: 'required' }]`. You may extend it (for example answer the two suggestion chips from `CLINICS` data).
- **Failure:** if the request fails (typed errors: `ollama_unreachable`, `model_missing`, `timeout`, `bad_output`, `not_configured`, or a network error), show an error bubble (`bubble--error`) and a link to manual filters (`/find`). Never leave the user without a way forward.

## Done when
- The demo query returns correctly filtered results in mock mode (Lakeshore, Fruitvale, Bayview as Strong/Possible).
- Live mode with Ollama unreachable shows the fallback: test it in the browser by intercepting `/api/chat` with a typed error, and in a unit test of your client.
- No name, email, phone, or coordinates appear in the request body (assert in a Playwright test).
- Keyboard only: type, Send, follow a result link, reach "See results".
- Note in the handoff: the live-model test happens on Loukik's Mac after pulling, not in this run.

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
