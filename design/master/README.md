# CareFit master design

The build follows this folder screen by screen. Spec and data per screen: [`../BRIEF.md`](../BRIEF.md).

## View it
Open `index.html` in a browser. It shows every screen at 390×844 in live frames; click through like a prototype. Each screen also opens on its own from `screens/`. No build step or server is needed.

## Files
| File | What it is |
|---|---|
| `tokens.css` | All raw values: color, type, space, radius, shadow, size, motion, z-index. The only place hex/px values live. |
| `components.css` | Base styles + every component. Uses tokens only. |
| `icons.js` | Lucide icon sprite (`<svg><use href="#i-name"/></svg>`). In the build, use the Lucide package with the same names. |
| `components.html` | Every component and state on one page. |
| `screens/01–13` | One file per screen (13 = optional Report a gap). |
| `contrast.py` → `CONTRAST.md` | Checks every color pair against WCAG 2.2 AA. Re-run after any token change. |

## Visual direction
- **Type:** Atkinson Hyperlegible Next, made by the Braille Institute for low-vision readers. One family; hierarchy comes from size and weight (800 titles, 700 labels, 400 body). Slashed zeros are part of the font's legibility design.
- **Color:** warm paper background, deep teal for action and "has", marigold as a fill only (step numbers, possible-fit badge, focus halo). Status colors always come with an icon and a word.
- **Signature element:** the **fit meter**. One segment per need, required first. Filled = has, striped = unknown, outlined = missing, so it reads in grayscale. It is `aria-hidden`; the badge and the count say the same thing in text.
- **Focus:** a 3px ink ring with a marigold halo, visible on light and dark surfaces.

## Components
App bar · back link · brand · button (primary / secondary / ghost / danger / danger-solid / sm / disabled) · icon button · action tile · chip (toggle) · tag (default / required / nice / filter) · feature status · fit badge · fit meter (plain + labeled groups) · reasons list · clinic card · feature row · list row / link card · text input · select · textarea · error message · checkbox list · segmented radios (+ grid variant) · disclosure group · notice (info / error) · status line · onboarding progress · view toggle · toolbar · map canvas + pin + your-location dot + map controls · bottom sheet · dialog · chat bubble (bot / user / error) · mini results · composer · empty state · letter · bottom nav · sticky dock.

## Rules for edits
- Change a value in `tokens.css`, never in a component or screen. Run `python3 design/master/contrast.py` after color edits.
- Inline `style` is only used for data-driven values: progress `--value`, meter group `--n`, and map pin positions.
- Every screen keeps the skip link, `<main id="main" tabindex="-1">`, one `h1`, and the bottom nav (except onboarding).
- New interactive elements must be at least 44×44px and use the shared focus style.

## Checks run (Playwright + axe-core, Chrome)
| Check | Result |
|---|---|
| Contrast, 35 color pairs | All pass AA (`CONTRAST.md`) |
| axe WCAG 2.2 AA + best practice, all 13 screens | 0 violations, except 2 target-size flags. These are elements under the sticky dock at the initial scroll position; 0 once scrolled into view. `scroll-padding-bottom` keeps keyboard focus clear of the dock. |
| 200% text (all screens) | No horizontal overflow; long words hyphenate; tiles and radius cells reflow |
| 320px width (all screens) | No horizontal overflow |
| Tap targets | All ≥ 44×44 (inline text links excepted) |
| Keyboard | Skip link first; tab order matches visual order; dialog opens on Cancel, Esc returns focus to the trigger |
| Reduced motion | Motion tokens drop to 0ms |

## Rubric self-review
| Criterion | Score | Weak spot |
|---|---|---|
| Accessibility | 5 | Not yet tested with VoiceOver / TalkBack (Step 5) |
| Clarity | 4 | Needs screen is long when many needs are checked |
| Match readability | 5 | Tier + count + meter + has/unknown/missing as text; required gaps are marked "(required)" |
| Visual polish | 4 | Map is placeholder art until Leaflet is in |
| Buildability | 5 | Plain HTML/CSS; native controls (checkbox, radio, details, dialog) |
| Distinctiveness | 4 | Fit meter + marigold/teal + Atkinson; the cards themselves are conventional |

## Build notes (Step 4)
- Self-host the font (it's on Google Fonts for the mockups only) so the PWA works offline.
- Map: Leaflet + OSM. Markers are buttons with the clinic name, fit, and distance in `aria-label`, and `aria-pressed` for the selected one. Keep Prev/Next in the sheet as the non-drag alternative. Keep the attribution.
- On route change, move focus to `#main`. Chat: append messages to the `role="log"` region and scroll to the newest.
- Map and list share rank numbers. Keep them in sync with the sort.
- The fit tiers and "patient-reported counts as Has" are confirmed (Step 3 scoring decision; rules in `plans/STEP-3-SETUP.md` §7).
