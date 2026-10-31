# CareFit

> **Find a doctor who can actually examine you.**

CareFit is a phone-first web app (PWA) that helps disabled patients find clinics with the equipment and accommodations they need, before they show up. Built for a hackathon on the theme *accessibility tools for navigating the medical care system for disabled users*.

Many wheelchair users go years without being weighed or examined on a table because their clinic has no accessible equipment. Federal rules (HHS Section 504, deadline July 8, 2026) now require most providers to have it, but patients still can't see who does. CareFit matches your access profile against a clinic library, shows the matches on a list and map, and drafts an accommodation request that cites the rule.

Scope and design decisions: [PROJECT.md](PROJECT.md).

## Features

- **Access profile**: needs across mobility, communication, sensory/cognitive and other, each marked *required* or *nice-to-have*, plus a location (GPS or ZIP) and search radius. Stored only on your device.
- **Search and match**: filter by specialty, distance and needs. Each clinic gets a fit score with reasons in text, e.g. *has: wheelchair scale · missing: ASL interpreter · unknown: patient lift*.
- **Results list and map**: the list is the primary view (screen-reader friendly); the map is secondary.
- **Clinic details**: hours, doctors, tap-to-call, directions, and a full access checklist with status, last-verified date and source.
- **Accommodation letter**: filled from your profile and the clinic, fully editable, cites Section 504 / ADA. Copy, share, email or print / save as PDF. Drafts are saved on the device.
- **AI assistant**: ask in plain language ("OB-GYN within 15 miles who can weigh me seated") and get filters and matching clinics. It runs on a local model, gives no medical advice, and falls back to manual filters if the AI is down.
- **Installable and offline**: works offline for the profile and bundled clinic data.
- **Accessible by default**: WCAG 2.2 AA contrast, 44×44 px targets, visible focus, works at 200% text, reduced motion, and never uses color alone for status.

The app comes with a demo profile (Maya) and ~20 **fictional** clinics in Oakland, CA. Use Oakland-area ZIP codes (e.g. 94612).

## Quick start

Requires **Node 24** (see `.nvmrc`) and npm 11.

```sh
cp .env.example .env          # AI runs in mock mode by default; no Ollama needed
npm ci
npx playwright install chromium   # only needed for tests
npm run dev                   # http://localhost:5173 (app + /api, hot reload)
```

Production build:

```sh
npm run build
npm start                     # http://127.0.0.1:8787
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload; `/api` is served on the same port. Add `-- --host` to open it from a phone on your LAN (GPS and install still need HTTPS). |
| `npm run build` | Typecheck, then build `dist/` (app, manifest, service worker). |
| `npm start` | Serve `dist/` and `/api` on one port (`PORT`, default 8787). Run `npm run build` first. |
| `npm run check` | **The one pass/fail command**: typecheck, unit tests (Vitest), and a Playwright + axe smoke test on a production build. Forces mock AI, so no Ollama needed. |
| `npm run test:unit` / `npm run test:e2e` | The two halves of `check`. |
| `npm run icons` | Re-render the PNG icons from `public/icon*.svg`. |

## AI setup

The assistant has two modes, set by `AI_MODE` in `.env`:

- **`mock`** (default): fixed replies, no model needed. Good for trying the app and for tests.
- **`live`**: forwards to a local [Ollama](https://ollama.com) model. No API keys and no cloud AI provider.

To turn on live mode:

1. Install Ollama and pull a model. `qwen2.5:7b` (~4.7 GB) works well on a 16 GB Mac:

   ```sh
   ollama pull qwen2.5:7b
   ollama list                       # copy the exact model name
   ```

2. Set these in `.env`:

   ```dotenv
   AI_MODE=live
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=qwen2.5:7b
   ```

3. Make sure Ollama is running (open the app or run `ollama serve`), then restart `npm run dev` / `npm start`.

4. Check it:

   ```sh
   curl -s localhost:8787/api/health   # use :5173 under npm run dev
   ```

   You want `"mode":"live"`, `"reachable":true` and `"modelInstalled":true`. To try live mode once without editing `.env`, run `AI_MODE=live npm start`.

The first request after a cold start can take about 30 s. Live mode never falls back to mock on its own: if something is wrong, the Ask screen shows the error and offers manual filters.

**How it works:** browser → same-origin `POST /api/chat` → CareFit server → Ollama `POST /api/chat`. The browser never calls Ollama. The server asks for [structured output](https://docs.ollama.com/capabilities/structured-outputs) (a JSON schema in Ollama's `format` field), validates the result, and returns a reply plus search filters. Only the messages, access needs, ZIP and radius are sent; name, contact details and GPS coordinates never leave the device. The server must run on the same machine as Ollama (or have a network path to it).

### Environment

`.env` is ignored by Git; `.env.example` lists every key. A missing key or `.env` never crashes the server.

| Key | Default | Meaning |
|---|---|---|
| `AI_MODE` | `mock` | `mock` (fixed replies) or `live` (Ollama). |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama server address. |
| `OLLAMA_MODEL` | empty | Exact name from `ollama list`. Required in live mode (otherwise `not_configured`). |
| `OLLAMA_TIMEOUT_MS` | `60000` | How long to wait for the model before a `timeout` error. |
| `PORT` / `HOST` | `8787` / `127.0.0.1` | Where `npm start` listens. |

### API

- `GET /api/health` returns `{ ok, mode, model, ollama: { reachable, modelInstalled } }`.
- `POST /api/chat` takes `{ messages, needs, zip?, radius }` (max 16 KB, 20 messages, 1000 characters each; unknown fields such as name or coordinates are rejected). It returns `{ reply, filters?, clinicIds?, mode }` or `{ error: { code, message } }`, where `code` is one of `bad_request`, `too_large`, `ollama_unreachable`, `model_missing`, `timeout`, `bad_output`, `not_configured`.

## Use it on a phone (optional)

GPS, the service worker, clipboard and "Install app" need HTTPS. [Tailscale Funnel](https://tailscale.com/kb/1223/funnel) gives your computer a stable public HTTPS URL:

1. Install Tailscale and sign in: `tailscale up`.
2. In the Tailscale admin console, enable HTTPS certificates and allow Funnel for the device (the `funnel` node attribute).
3. `npm run build && npm start`
4. `tailscale funnel --bg 8787`. It prints `https://<machine>.<tailnet>.ts.net`.
5. Open that URL on the phone and use Share → "Add to Home Screen". Stop with `tailscale funnel reset`.

This is a demo server: no auth or rate limiting, only request size and message-count caps.

## Tools and integrations

| Tool / API | Used for |
|---|---|
| React 19, React Router, Vite, TypeScript | App and build |
| `vite-plugin-pwa` (Workbox) | Manifest, service worker, offline cache |
| Node `http` server (`server/`) | Static files and `/api` |
| [Ollama Chat API](https://docs.ollama.com/api/chat) | Local AI assistant and structured search filters |
| [Leaflet](https://leafletjs.com) + [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/) | Results map (with attribution) |
| [Census ZCTA Gazetteer](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html) | Oakland ZIP centroids, bundled once |
| [Tailscale Funnel](https://tailscale.com/kb/1223/funnel) | HTTPS URL for the phone demo |
| Browser APIs | `localStorage` (profile, drafts), Geolocation, Clipboard, Web Share, Print, `mailto:` / `tel:` links |
| Atkinson Hyperlegible Next, Lucide | Readable font, icons |
| Vitest, Playwright, axe-core | Unit tests, end-to-end and accessibility checks |

No API keys are needed. Clinics are fictional with hand-placed coordinates, so there are no NPI or geocoding calls.

## Layout

```
src/contracts   shared types, feature list, validators
src/lib         storage, geo, ZIPs, hours, filters, match engine
src/data        fictional clinics, ZIP centroids, demo profile
src/components  shared React components
src/shell       profile provider, welcome and shell screens
src/screens     profile, clinic (details + letter), find (search, results, map), ask (assistant)
server          node:http API + static server; assistant/ holds the prompt and mock replies
tests           unit tests, Playwright + axe e2e
design          design brief and master mockups
```
