# CareFit — Design brief

The spec behind `design/master/`. Scope lives in `PROJECT.md`; this file says what each screen shows and how.

> Sample content (clinic names, ZIP 94612, persona) is fictional placeholder until Step 1 decides **clinic data** and **demo area**.

## Product
CareFit helps disabled patients find clinics that have the equipment and accommodations they need, before they show up. Profile on the phone → match clinics → see fit + reasons → request accommodations by letter. An AI assistant turns plain language into filters.

## Format
- **Device:** phone, 390×844. Also checked at 320px wide and 200% text.
- **Theme:** light only. Semantic tokens so a dark / high-contrast theme can be added later.
- **Files:** HTML/CSS. One file per screen in `master/screens/`, shared `tokens.css` + `components.css`, all screens on `master/index.html`.
- **Navigation:** bottom tabs **Find · Ask · Profile**. Onboarding is a linear flow before the tabs (no tab bar). Sub-screens (results, clinic, letter) keep the tab bar and have a labeled Back link.

## Accessibility (every screen)
- WCAG 2.2 AA contrast: text 4.5:1, large text and UI boundaries 3:1. Checked by `master/contrast.py`.
- Tap targets ≥ 44×44px, ≥ 8px apart.
- Type in `rem`, no fixed heights on text; layout survives 200% text and 320px width.
- No information by color alone: every status = icon + text; the fit meter also uses fill/stripe/empty.
- Visible focus everywhere: 3px ink ring + marigold halo.
- `prefers-reduced-motion`: all motion tokens drop to 0.
- Landmarks + skip link on every screen; one `h1` per screen; real `<label>`s; `fieldset`/`legend` for groups; chat in a live log.

## Shared vocabulary
**Feature status** (clinic data, `accessFeatures[key].status`)

| Status | Shown as |
|---|---|
| `verified` | check icon · "Verified" · date + source |
| `patient-reported` | person-check icon · "Patient-reported" · date |
| `unknown` | question icon · "Unknown" · "No information yet" |
| `not-available` | x icon · "Not available" · date + source |

**Per need, for one user** (match engine `has[] / unknown[] / missing[]`): **Has** · **Unknown** · **Missing**.
Design assumes `patient-reported` counts as Has (detail screen still shows the source).

**Fit tier** (badge on cards and detail), always with a count like "5 of 6 needs":
- **Strong fit** — every required need is Has.
- **Possible fit** — no required need is Missing, but at least one is Unknown.
- **Poor fit** — at least one required need is Missing.

**Feature labels** (full label in profile / detail / letter; short label on cards)

| Key | Full label | Short |
|---|---|---|
| `exam-table` | Height-adjustable exam table | Adjustable table |
| `scale` | Wheelchair-accessible scale | Wheelchair scale |
| `lift` | Patient lift or lift-compatible space | Patient lift |
| `mammography` | Accessible mammography | Accessible mammogram |
| `entrance` | Accessible entrance and parking | Step-free entrance |
| `restroom` | Accessible restroom | Accessible restroom |
| `turning-space` | Wheelchair turning space in exam rooms | Turning space |
| `asl` | In-person ASL interpreter | ASL interpreter |
| `vri` | Video remote interpreting (VRI) | Video interpreter |
| `cart` | CART / live captioning | Live captions |
| `tactile` | Tactile interpreter (DeafBlind) | Tactile interpreter |
| `braille` | Braille or large-print materials | Braille / large print |
| `plain-language` | Plain-language materials | Plain language |
| `quiet-room` | Quiet or sensory-friendly room | Quiet room |
| `lighting` | Adjustable lighting | Adjustable lighting |
| `extended-time` | Extended appointment time | Extra time |
| `minimal-wait` | Minimal-wait scheduling | Minimal wait |
| `service-animal` | Service animals welcome | Service animals |
| `telehealth` | Telehealth option | Telehealth |

Categories: **Mobility** (first 7), **Communication** (next 6), **Sensory & cognitive** (next 4), **Other** (last 2).

## Screens
Fields refer to `PROJECT.md` → Build list #1 (profile) and #3 (clinic).

| # | Screen | File | Shows | Main action |
|---|---|---|---|---|
| 1 | Welcome | `01-welcome.html` | Pitch, 3-step how-it-works, privacy line | Get started · Skip |
| 2 | Onboarding: needs | `02-needs.html` | Feature list by category; per need **Required / Nice to have** | Continue |
| 3 | Onboarding: location | `03-location.html` | GPS button, ZIP fallback, radius (5–50 mi) | Show clinics |
| 4 | Find (home) | `04-find.html` | Location + radius, type of care, needs from profile, entry into Ask | Show matches |
| 5 | Results: list | `05-results-list.html` | Count, sort, filters; per clinic: rank, `name`, `type`, distance, hours, fit tier, meter, has/unknown/missing | Open clinic |
| 6 | Results: map | `06-results-map.html` | Same results as numbered markers (`lat`, `lng`) + selected-clinic sheet with Prev/Next | Open clinic |
| 7 | Results: empty | `07-results-empty.html` | Why nothing matched + one-tap fixes | Widen radius / relax a need |
| 8 | Clinic detail | `08-clinic-detail.html` | `name`, `type`, `specialties`, `address`, distance, `hours`, `phone`, `website`, `doctors[]`; fit summary; checklist of your needs with `status`, `lastVerified`, `source`; other features | Request accommodations |
| 9 | Request form | `09-request-form.html` | Prefilled from profile + clinic: name, contact, date, doctor, accommodations (checkbox group), notes | Preview letter |
| 10 | Letter preview | `10-letter-preview.html` | Letter citing Section 504 / ADA, "not legal advice" note, draft-saved status | Copy · Share · Email · Print |
| 11 | Ask (assistant) | `11-assistant.html` | What gets sent, chat log, applied filters as chips, top matches | Send · See results |
| 12 | Profile | `12-profile.html` | Needs, location, letter details, saved letters, privacy, **Reset demo** (confirm dialog) | Edit · Reset |
| 13 | *(Optional)* Report a gap | `13-report-gap.html` | What was missing, visit date, notes; saved on the phone only | Save report |

Request-letter path: Clinic detail → **Request accommodations** → **Preview letter** = 2 taps.

## Sample persona (used in every screen)
Maya, a power-wheelchair user near ZIP 94612, radius 15 mi, looking for an OB-GYN.
- **Required:** wheelchair-accessible scale, height-adjustable exam table, accessible entrance and parking
- **Nice to have:** patient lift, accessible restroom, extended appointment time

Results for "OB-GYN within 15 mi" (best match first). These cover the close-but-poor and far-but-perfect cases:

| # | Clinic | Distance | Tier |
|---|---|---|---|
| 1 | Lakeshore Women's Health | 4.8 mi | Strong fit · 5 of 6 |
| 2 | Fruitvale OB-GYN Associates | 1.1 mi | Possible fit · 4 of 6 (table unknown) |
| 3 | Bayview Medical Center | 7.9 mi | Possible fit · 3 of 6 |
| 4 | Grand Avenue Women's Clinic | 0.6 mi | Poor fit · 2 of 6 (no wheelchair scale) |

## Out of scope for the mockups
- Dark / high-contrast theme (optional feature; tokens are ready for it).
- Real map tiles: the map is a drawn placeholder; the build uses Leaflet + OSM with attribution.
- Optional features other than Report a gap.
