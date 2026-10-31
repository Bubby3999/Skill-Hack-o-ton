# CareFit

> **Find a doctor who can actually examine you.**

**Hackathon theme:** Accessibility tools for navigating the medical care system for disabled users
**Format:** Phone-first Progressive Web App (PWA) · no database (on-device `localStorage`) · in-app AI assistant

---

## 1. Name & description

### One-liner
CareFit helps disabled patients find clinics that have the equipment and accommodations they need, before they show up.

### Pitch
Many wheelchair users go years without being weighed or examined on a table because their clinic has no accessible equipment. Federal rules now require most providers to have it, but patients still can't see who does. CareFit matches your access profile against a library of clinics, shows the matches on a map, and drafts an accommodation request that cites the rule. An AI assistant lets you search in plain language. Your profile stays on your phone.

> If **Report a gap** (optional) ships, add this to the pitch: *"…and lets you report clinics that fall short."*

### The problem
- Wheelchair users get skipped for weigh-ins and full exams when a clinic has no accessible scale or height-adjustable exam table.
- Deaf patients show up and find no interpreter booked, or a video interpreter that doesn't work.
- Autistic and sensory-sensitive patients walk into loud, bright waiting rooms with no warning.
- Patients can't check any of this in advance, so they call around, guess, or skip care.

### Why now

- HHS's updated **Section 504** rule (finalized 2024) set **July 8, 2026** as the deadline for most providers that receive HHS funding, including Medicare and Medicaid, to have at least one accessible exam table and one accessible weight scale.
- State and local government clinics had until **August 9, 2026** under the matching DOJ ADA Title II rule.
- These rules can now be enforced, but there's still no public way to see which clinics comply.

### How it works
1. **Profile:** set your access needs (mobility, communication, sensory/cognitive, other) and your location. It's stored on your device only.
2. **Search:** use filters, or ask the AI assistant in plain language.
3. **Match:** each clinic gets a fit score with reasons, e.g. *has: wheelchair scale · missing: ASL interpreter · unknown: patient lift*.
4. **Act:** open the clinic's details and generate an accommodation request letter in a few taps.

### Who it's for
Disabled patients and their caregivers, including people with mobility disabilities, Deaf and hard-of-hearing people, blind and low-vision people, and autistic, sensory-sensitive, and cognitively disabled people.

### Theme fit
| Theme part | How CareFit covers it |
|---|---|
| Accessibility tool | Matches clinics to disability-specific access needs; the app itself meets WCAG 2.2 AA |
| Navigating the medical care system | Finding a provider who can treat you is the first step of navigating care |
| Disabled users | The profile covers mobility, communication, sensory, and cognitive needs |

### Privacy
The profile stays in `localStorage` on the user's device. It leaves the device only when the user messages the AI assistant, and the app should say so on that screen.

---

## 2. Build list

### Necessary (MVP)

1. **User profile** (`localStorage`)
   - Location: GPS (Geolocation API) or ZIP code, plus a search radius
   - Access needs grouped by category (see the shared feature list in #3), each marked **required** or **nice-to-have**
   - Optional personal details used in letters: name and contact info
   - Edit profile, plus a **Reset demo** control
2. **Onboarding**
   - Short first-launch setup that writes the profile
   - Can be skipped or resumed
   - Ends on the Search screen
3. **Clinic library** (static JSON bundled with the app)
   - Fields: `id`, `name`, `type` (clinic / hospital / urgent care / imaging), `specialties[]`, `address`, `lat`, `lng`, `phone`, `website`, `hours`, `doctors[] {name, specialty, npi}`, `accessFeatures {key: {status, lastVerified, source}}`, `isDemo`
   - Feature statuses: `verified` · `patient-reported` · `unknown` · `not-available`
   - **Shared access-feature list** (used by both the profile and the library):
     - *Mobility:* height-adjustable exam table, wheelchair-accessible scale, patient lift / lift-compatible clearance, accessible mammography, accessible entrance and parking, accessible restroom, wheelchair turning space in exam rooms
     - *Communication:* in-person ASL interpreter, video remote interpreting (VRI), CART / live captioning, tactile interpreter (DeafBlind), braille / large-print materials, plain-language materials
     - *Sensory / cognitive:* quiet or sensory-friendly room, adjustable lighting, extended appointment time, minimal-wait scheduling
     - *Other:* service animals welcome, telehealth option
   - Seed script that builds the JSON (clinic info → geocode → access features)
   - Visible **Demo data** label anywhere made-up equipment data appears
4. **Match engine**
   - Pure function: `(profile, clinic, userLocation) → { score, has[], missing[], unknown[], distance }`
   - Unit-tested
5. **Search + filters**
   - Specialty, distance, access needs (pre-filled from the profile)
   - Sort by best match or nearest
6. **Results: list + map**
   - The list is the primary view (works well with screen readers); the map is secondary
   - Cards show the score and the reasons as text, never by color alone
   - Empty state when nothing matches
7. **Clinic detail**
   - Info, doctors, hours, tap-to-call, directions link
   - Full access checklist with status, last-verified date, and source
   - Buttons that lead into the request letter (and the optional features)
8. **Accommodation request form**
   - Auto-filled from the profile and the clinic; the user can edit everything
   - Appointment date and the specific accommodations requested
   - Generates a letter that cites Section 504 / ADA, with a "not legal advice" note
   - Output: copy, share (Web Share API), email (`mailto:`), print / save as PDF
   - Drafts saved to `localStorage`
9. **AI assistant (in-app)**
   - Turns a plain-language request into structured filters and shows the results
   - Example: *"OB-GYN within 15 miles who can weigh me seated"*
   - Answers questions about a clinic's features
   - Gives no medical advice
   - Falls back to manual filters if the AI is down
10. **AI proxy**
    - One serverless function that holds the API key, so the key never ships to the browser
11. **PWA shell**
    - Manifest, icons (192 / 512 / maskable), service worker
    - Installable; works offline for the profile and cached clinics
12. **Accessibility baseline** (applies to every screen)
    - WCAG 2.2 AA contrast; labeled controls; 44×44px minimum tap targets
    - Works at 200% text size; visible focus; no information by color alone
    - Respects reduced motion; ARIA live regions for chat messages and results updates

### Optional

| Feature | What it adds |
|---|---|
| Report a gap | "They didn't have it" → a report saved on the device with date and details |
| Complaint draft | Turns a report into a draft complaint to HHS's Office for Civil Rights |
| Call script generator | Questions to ask a clinic by phone to confirm equipment |
| Saved clinics | Favorites list in `localStorage` |
| Visit prep checklist | What to bring and what to confirm the day before |
| Access card | A one-screen or QR summary of your needs to show the front desk |
| Voice input | Speak to the assistant (Web Speech API) |
| Read aloud | Text-to-speech for clinic details and letters |
| High-contrast / dark theme | Extra visual modes |
| Maps handoff | Open directions in Apple or Google Maps |
| Insurance filter | Filter clinics by accepted insurance |
| Clinic self-report portal | Clinics submit their own equipment info |
| Shared database | Reports reach other users (replaces local-only storage) |
| Multi-language | Spanish first |

---

## 3. Outside sources

### Core
| Source | Used for | Need | Notes |
|---|---|---|---|
| Frontend framework: **TBD in Step 3** | App UI | Necessary | Options: Vite + React, Vite + Svelte, Next.js, vanilla JS |
| [Web Storage API (`localStorage`)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) | Profile, drafts, settings | Necessary | Built into the browser; stores strings only, so use `JSON.stringify`/`parse`; about 5MB limit |
| [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) | User location | Necessary | Built in; requires HTTPS |

### Map & location
| Source | Used for | Need | Notes |
|---|---|---|---|
| [Leaflet](https://leafletjs.com/) | Map view | Necessary | Free, open source, no API key |
| [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/) | Map imagery | Necessary | Free; attribution required; fine at demo-level traffic |
| [US Census Geocoder](https://geocoding.geo.census.gov/geocoder/) | Address → lat/lng for seed data | Necessary (pick one) | Free, no key, supports batch lookups |
| [Nominatim (OSM)](https://operations.osmfoundation.org/policies/nominatim/) | Address → lat/lng; ZIP → lat/lng | Alternative | Max 1 request/sec; run it in the seed script, not the app |
| [Turf.js](https://turfjs.org/) | Distance math | Optional | A ~10-line haversine function does the same job |

### Clinic data
| Source | Used for | Need | Notes |
|---|---|---|---|
| [NPPES NPI Registry API](https://npiregistry.cms.hhs.gov/api-page) | Real clinic and doctor names, addresses, specialties | Necessary (pick one) | Free CMS data; call it from the seed script, not the browser |
| [CMS Provider Data: Doctors and Clinicians](https://data.cms.gov/provider-data/) | Doctors linked to group practices | Optional | Downloadable dataset |
| Fictional data | Clinics invented for the demo | Alternative | Avoids presenting made-up equipment claims about real clinics |

> Equipment and accommodation data for clinics doesn't exist publicly. That missing data is the problem CareFit solves. For the demo it's made up and must be labeled **Demo data**.

### AI
| Source | Used for | Need | Notes |
|---|---|---|---|
| LLM API: **TBD in Step 3** (e.g., [Claude API](https://docs.claude.com)) | In-app assistant | Necessary | Use tool use / structured output to get filters back as JSON |
| Serverless host: **TBD in Step 3**: [Vercel Functions](https://vercel.com/docs/functions), [Netlify Functions](https://docs.netlify.com/functions/overview/), [Cloudflare Workers](https://developers.cloudflare.com/workers/) | AI proxy that holds the key | Necessary | GitHub Pages can't run functions |

### PWA
| Source | Used for | Need | Notes |
|---|---|---|---|
| [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest) | Installability | Necessary | Built in |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) or [Workbox](https://developer.chrome.com/docs/workbox) | Service worker and caching | Necessary (pick one) | vite-plugin-pwa only if the project uses Vite |
| [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) | Share the letter | Necessary | Built in; fall back to copy |
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | Voice input, read aloud | Optional | Browser support varies |

### Testing & accessibility
| Source | Used for | Need | Notes |
|---|---|---|---|
| [Playwright](https://playwright.dev/) | End-to-end tests | Necessary | Already in the repo |
| [@axe-core/playwright](https://playwright.dev/docs/accessibility-testing) | Automated accessibility scans | Necessary | Plugs into Playwright |
| [Vitest](https://vitest.dev/) | Unit tests (match engine, storage, letter) | Necessary | Or Jest |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) | Accessibility and PWA audits | Necessary | Built into Chrome DevTools |
| VoiceOver (iOS) / TalkBack (Android) | Manual screen reader testing | Necessary | Built into phones |
| [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | Palette contrast | Necessary | Free |

### Dev harness (already in `Bubby3999/Skill-Hack-o-ton`)
| Source | Used for |
|---|---|
| Skills: `agent-search`, `ponytail`, `ui-ux-pro-max`, `graphify` (+ any others in `.agents/skills/`) | Agent workflow |
| `CLAUDE.md` / `AGENTS.md` | Skill config and agent lineup |
| Design model: Opus | Step 2 mockups |

### Legal & standards reference (for the letter and the pitch)
| Source | Used for |
|---|---|
| [HHS Section 504 detailed fact sheet](https://www.hhs.gov/civil-rights/for-individuals/disability/section-504-rehabilitation-act-of-1973/ocr-detailed-504-fact-sheet/index.html) | Rule summary, letter wording |
| [ADA.gov: Medical diagnostic equipment fact sheet](https://www.ada.gov/resources/2024-08-08-mde-fact-sheet/) | Public-entity (DOJ) rule |
| [U.S. Access Board: MDE Standards](https://www.access-board.gov/mde/) | What counts as an "accessible" table or scale |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | The app's own accessibility target |
| [HHS Office for Civil Rights](https://www.hhs.gov/ocr/) | Complaint route (optional feature) |
