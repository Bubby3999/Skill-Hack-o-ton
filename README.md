# CareFit

Find clinics that match a patient's accessibility needs. See [PROJECT.md](PROJECT.md) for scope and [STEP-PLAN.md](STEP-PLAN.md) for the build plan. The foundation (shell, shared components, contracts, match engine, clinic data, server, PWA) is built; the screens are being built per [plans/tasks/](plans/tasks/).

## Quick start

Requires **Node 24** (`.nvmrc`) and npm 11.

```sh
cp .env.example .env          # AI mode defaults to mock; no Ollama needed
npm ci
npx playwright install chromium
npm run dev                   # app + /api on http://localhost:5173, hot reload
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload; `/api/health` and `/api/chat` are served on the same port. Add `-- --host` to reach it from a phone on your LAN (geolocation and install still need HTTPS). |
| `npm run build` | Typecheck, then build `dist/` (app, manifest, service worker). |
| `npm start` | Production server: serves `dist/` and `/api` on one port (`PORT`, default 8787, bound to `127.0.0.1`). Run `npm run build` first. |
| `npm run check` | **The one pass/fail command**: typecheck, unit tests (Vitest), and the Playwright + axe smoke test on a production build (every route at 390×844, 0 serious or critical axe issues, keyboard, PWA manifest and service worker). It forces `AI_MODE=mock`, so it needs no Ollama. |
| `npm run test:unit` / `npm run test:e2e` | The two halves of `check`. |
| `npm run icons` | Re-render the PNG icons from `public/icon*.svg`. |

The e2e run picks its own port per checkout (`E2E_PORT` overrides it), so parallel worktrees don't collide.

## Environment

`.env` is ignored by Git; `.env.example` lists every key. A missing key or a missing `.env` never crashes the server.

| Key | Default | Meaning |
|---|---|---|
| `AI_MODE` | `mock` | `mock` returns fixed replies (no Ollama). `live` forwards to Ollama and returns a typed error if it can't; it never falls back to mock on its own. |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Local Ollama server. |
| `OLLAMA_MODEL` | empty | Exact name from `ollama list`. Empty is fine in mock mode; live mode answers `not_configured`. |
| `OLLAMA_TIMEOUT_MS` | `60000` | Wait for the model before a `timeout` error. The first request after a cold start can take about 30 s. |
| `PORT` / `HOST` | `8787` / `127.0.0.1` | Where `npm start` listens. |

### API

- `GET /api/health` returns `{ ok, mode, model, ollama: { reachable, modelInstalled } }`.
- `POST /api/chat` takes `{ messages, needs, zip?, radius }` (at most 16 KB, 20 messages, 1000 characters each; unknown fields such as name or coordinates are rejected) and returns `{ reply, filters?, clinicIds?, mode }` or `{ error: { code, message } }` with `code` one of `bad_request`, `too_large`, `ollama_unreachable`, `model_missing`, `timeout`, `bad_output`, `not_configured`.
- Try live mode without touching `.env`: `AI_MODE=live npm start`, then `curl -s localhost:8787/api/health`.


## Configuration

Local AI uses **Ollama** on Loukik's Mac; the phone reaches the app through **Tailscale Funnel**. No API keys are required for the integrations below.

- `.env` holds local configuration and is ignored by Git. New checkouts: `cp .env.example .env`.
- `OLLAMA_BASE_URL=http://127.0.0.1:11434` is the local server address.
- Set `OLLAMA_MODEL` to an exact downloaded local model name from `ollama list`. Start Ollama before using the assistant.
- The server reads these through `.env` (see Environment above). Set-up details are in [plans/STEP-3-SETUP.md](plans/STEP-3-SETUP.md).

AI flow: browser → same-origin `POST /api/chat` → local Ollama `POST /api/chat`. Use a JSON schema in Ollama's `format` field for search filters, validate the response, and fall back to manual filters on failure. See [Ollama API](https://docs.ollama.com/api/introduction) and [structured outputs](https://docs.ollama.com/capabilities/structured-outputs).

The backend must run on the computer running Ollama, or have a configured network path to it. A public serverless deployment cannot reach this computer's `127.0.0.1`. A phone should call the app backend, not its own localhost. Tailscale Funnel gives the Mac a stable HTTPS URL, so the installed PWA keeps working across restarts.

### Local Ollama setup

For Loukik's M2 MacBook Air with 16 GB unified memory, start with `qwen2.5:7b` (about 4.7 GB to download). It leaves more memory available than the existing 14B coding model and is a candidate for CareFit's short clinic questions and structured search filters.

```sh
open /Applications/Ollama.app
ollama pull qwen2.5:7b
ollama list
```

Set these values in your local `.env`:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
```

Verify the server with `curl http://127.0.0.1:11434/api/version`. Local requests need no sign-in or API key. The CareFit backend still needs to be built before the in-app assistant can use this configuration.

### HTTPS for the phone: Tailscale Funnel

Geolocation, the service worker, clipboard, and "Install app" need HTTPS. Funnel gives the Mac a stable public HTTPS URL that proxies to the local server. Steps (not yet run on this Mac; Tailscale is not installed here):

1. Install Tailscale on the Mac and sign in once (interactive): `tailscale up`.
2. In the Tailscale admin console, enable HTTPS certificates and allow Funnel for this device (Access controls: the `funnel` node attribute).
3. Build and start CareFit: `npm run build && npm start` (listens on `127.0.0.1:8787`).
4. Expose it: **`tailscale funnel --bg 8787`**. The command prints the public `https://<machine>.<tailnet>.ts.net` URL.
5. Check with `tailscale funnel status`. Stop with `tailscale funnel reset`.
6. On the phone, open the URL and use Share / "Add to Home Screen" to install. The URL stays the same across restarts, so the installed app keeps working.

This is a demo server: no auth or rate limiting, only request size and message-count caps.

## Required APIs and integrations (MVP only)

| API / integration | Purpose | Where used |
|---|---|---|
| [Census ZCTA Gazetteer](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html) | ZIP centroids for the Oakland demo area (one-time file, bundled) | Browser (ZIP entry) |
| [Tailscale Funnel](https://tailscale.com/kb/1223/funnel) | Stable HTTPS URL from Loukik's Mac to the phone | Demo host |
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

ZIP entry uses a bundled table of Oakland-area ZIP centroids. All clinics are fictional (~20 in Oakland) with hand-placed coordinates, so no NPI or geocoding calls are needed.

## Layout

```
src/contracts   shared types, feature list, validators (import from here)
src/lib         storage, geo, zips, hours, filters, match engine
src/data        fictional clinics, ZIP centroids, demo profile (Maya)
src/components  shared React components (port of design/master)
src/shell       profile provider, placeholders
src/screens     one folder per worker: profile (A), clinic (B), find (C), ask (D)
server          node:http API + static server; assistant/ holds the prompt and mock replies
tests           unit tests, Playwright + axe e2e
```

## Skills (tweaked slightly)

agent-search, ponytail, ui-ux-pro-max, graphify...

## Tools

| Area | Tools |
|---|---|
| Languages and formats | TypeScript, JavaScript, Python (skill scripts only), JSON, dotenv (`.env`) |
| Frontend | React 19, Vite, React Router, Progressive Web App (`vite-plugin-pwa`, Workbox service worker) |
| Maps | Leaflet (`react-leaflet`) with OpenStreetMap tiles to show distance between the user and clinics |
| Backend | Node.js 24 (`node:http`, run with `tsx`), REST API (`/api/health`, `/api/chat`) |
| Local AI | Ollama (local LLM runtime) with `qwen2.5:7b`, JSON-schema structured outputs |
| Testing | Vitest (unit), Playwright (end-to-end), axe-core (accessibility) |
| Hosting (demo) | Tailscale Funnel for a public HTTPS URL |
| AI coding agents | Claude Code (Claude Opus 5.5, Claude Sonnet 5.5), Codex (GPT) |

## Phases

1. [x] Decide on an idea. 
2. [x] Discuss the execution plan, what will be built, and the tools.
3. [x] Divide the execution plan into chunks.
4. [ ] Execute the plan chunks, then repeat.
5. [ ] Run checks and start-to-finish testing, then wrap up with fixes.

## Set up

- CLAUDE.md: finalize your skills
- AGENTS.md: enter your lineup
