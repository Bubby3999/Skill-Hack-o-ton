# Step 4 finish: onboarding and gap fixes

One coding session (Opus 5.5, no workers). Branch `step4/finish`. Source: the "what's left" list after the Step 4 run (`plans/RUN-LOG.md`).

## Features

### 1. Onboarding (screens 01–03, MVP #2)
- **First launch:** `/` opens **Welcome** when the device has no saved profile and setup was never finished or skipped. After that, `/` opens Find. Deep links (`/find`, `/clinic/…`) never redirect.
- **Welcome (01):** pitch, 3 steps, privacy line. **Get started** → step 1. **Skip for now** → Find with the demo profile.
- **Step 1 of 2, needs (02):** the needs editor with a progress line, **Back** (Welcome) and **Skip setup**. Starts with no needs checked. **Continue** → step 2.
- **Step 2 of 2, location (03):** the location editor (GPS or ZIP; radius 15 by default). **Show clinics near me** saves the profile and opens Find.
- **Profile written by setup:** the chosen needs, location and radius. Letter details start empty (no demo name).
- **Skip / resume:** the step and the picks so far are saved on the device. Leaving mid-setup and opening `/` again resumes at that step. **Skip setup** keeps the demo profile.
- **Reset demo** clears the setup state, so the next launch shows Welcome.

### 2. Fixes from the worker reports
- **Results link:** "Add your needs" on a clinic card returns to the results without the old `needs=` list, so the new profile needs apply.
- **Map Prev/Next:** wraps around (last → first), so the buttons never disable and focus never drops.
- **Map tiles:** checked online in a real browser (tiles load, attribution visible). The default check stays offline.
- **Center on my location:** a GPS profile asks for a fresh position, updates the saved GPS location and recenters. If that fails, the map centers on the saved spot and says why. A ZIP profile's button says "Center on ZIP <zip>".
- **Assistant live:** run `AI_MODE=live` against local Ollama (`qwen2.5:7b`) with the demo phrases and open-ended ones. Fix the prompt or validation where it fails, and log the results below.

## Direction

- **Decisions**
  - Optional features: none built (user decision: only if necessary; none is needed for the MVP flow). Report a gap stays hidden; the pitch keeps its current wording.
  - Onboarding reuses the needs and location editors (one form each, two modes), so edit and setup can't drift apart.
  - The first-launch check lives on `/` only, so tests, shared links and the installed PWA's deep links keep working.
  - No new dependencies.
- **Constraints:** every new screen renders inside `<Screen>`, with one `h1` and tokens only. Storage goes only through `src/lib/storage.ts`; shared shapes come from the contracts.
- **Watch-outs**
  - The smoke test expects `/` → `/find`. It changes to: empty device → `/welcome`.
  - New routes go into `tests/e2e/routes.ts` so the axe smoke scan covers them.
- **Out of scope:** optional features, phone install and VoiceOver passes (Step 5), Lighthouse scores, Tailscale.

## Done when
- `npm run check` passes, with new tests for onboarding and each fix.
- Fresh device: Welcome → setup → Find → results → clinic → letter works.
- The live assistant results are logged below.

## Live assistant log
`qwen2.5:7b`, 2026-10-31.
- **Before:** Ollama ran with a 4,096-token context, and the prompt (~7k tokens) lost its rules. Answers took 45–60 s, 2 of 11 timed out, none returned filters, and clinic facts were invented.
- **Fix:** compact one-line clinic records (11k characters instead of 24k), `num_ctx: 8192`, a search rule plus one example.
- **After (4 prompts):**
  - ASL primary care within 5 mi: correct filters, 13 s.
  - Chest pain: refused medical advice, 5 s.
  - OB-GYN demo phrase: timed out (60 s), most likely the model reloading for the new context size. Not rerun.
  - "Does Lakeshore have a patient lift?": no answer, and it set filters. Should say Unknown.
- **Still open:** rerun the demo phrase warm; clinic questions; consider `OLLAMA_TIMEOUT_MS=90000` and warming the model before a demo.
