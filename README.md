# CareFit

Find clinics that match a patient's accessibility needs. See [PROJECT.md](PROJECT.md) for scope and [STEP-PLAN.md](STEP-PLAN.md) for the build plan. The app runtime has not been scaffolded yet.

## Configuration

Local AI uses **Ollama**, replacing the hosted LLM and serverless-host assumptions in the planning docs. No API keys are required for the integrations below.

- `.env` holds local configuration and is ignored by Git. New checkouts: `cp .env.example .env`.
- `OLLAMA_BASE_URL=http://127.0.0.1:11434` is the local server address.
- Set `OLLAMA_MODEL` to an exact downloaded local model name from `ollama list`. Start Ollama before using the assistant.
- These variables are for the planned backend; environment loading and app start commands will be wired when the stack is selected.

Planned AI flow: browser → same-origin `POST /api/chat` → local Ollama `POST /api/chat`. Use a JSON schema in Ollama's `format` field for search filters, validate the response, and fall back to manual filters on failure. See [Ollama API](https://docs.ollama.com/api/introduction) and [structured outputs](https://docs.ollama.com/capabilities/structured-outputs).

The backend must run on the computer running Ollama, or have a configured network path to it. A public serverless deployment cannot reach this computer's `127.0.0.1`. A phone should call the app backend, not its own localhost.

## Required APIs and integrations (MVP only)

| API / integration | Purpose | Where used |
|---|---|---|
| [NPPES NPI Registry API](https://npiregistry.cms.hhs.gov/api-page) | Seed real clinic/provider names, addresses, specialties and NPIs | Seed script |
| [US Census Geocoder](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) | Convert clinic street addresses to coordinates | Seed script |
| [OpenStreetMap tile service](https://operations.osmfoundation.org/policies/tiles/) | Map imagery through Leaflet; visible attribution required; no offline tile prefetch | Browser |
| [Ollama Chat API](https://docs.ollama.com/api/chat) | Local assistant and structured search filters | Local backend |
| CareFit `POST /api/chat` (to build) | Validate assistant requests/results and forward to Ollama | Browser → backend |
| Web Storage (`localStorage`) | Profile, settings and letter drafts | Browser |
| Geolocation (`navigator.geolocation`) | GPS location with user permission | Browser |
| Fetch (`fetch`) | Call the AI backend; seed scripts also make HTTP requests | Browser / scripts |
| Clipboard (`navigator.clipboard.writeText`) | Copy accommodation letter | Browser |
| Web Share (`navigator.share`) | Share letter; fall back to copy | Browser |
| Print (`window.print`) | Print letter or save as PDF where supported | Browser |
| Service Worker + Cache Storage | Offline app shell and bundled clinic data | Browser |

`mailto:` and `tel:` links handle email drafts and tap-to-call; no email or phone API is needed. Letters use a reviewed template. Leaflet is a library; the web app manifest is a file, not an API. Geolocation, clipboard, service workers and Web Share require a secure context (HTTPS or trusted localhost). Web Share has limited browser support.

ZIP-only location lookup still needs a data source: Census Geocoder requires a street address. Plan a bundled ZIP-to-coordinate lookup for the demo area; its dataset is not selected yet. NPI data does not provide the accessibility equipment checklist; fabricated access features must be labeled **Demo data**.

## Skills (tweaked slightly)

agent-search, ponytail, ui-ux-pro-max, graphify...

## Tools

playwright...

## Phases

1. [x] Decide on an idea. 
2. [ ] Discuss the execution plan, what will be built, and the tools.
3. [ ] Divide the execution plan into chunks.
4. [ ] Execute the plan chunks, then repeat.
5. [ ] Run checks and start-to-finish testing, then wrap up with fixes.

## Set up

- CLAUDE.md: finalize your skills
- AGENTS.md: enter your lineup
