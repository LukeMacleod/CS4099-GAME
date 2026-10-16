# Art-direction Spike A — the V2 game hub

**Decides:** that "Mario Kart level graphics" can be answered with hand-authored layered SVG
plus CSS animation, with no WebGL, no raster assets, no paid tool and no licence risk.
**Assumes:** a 2018 iPad in Safari is the floor device, and the hub must stay beautiful when
every Gaelic string on it is still unverified.
**Depends on it:** the design system's colour/type tokens, the world bible's character canon,
and the product spec's game list — none of which existed when this was built.
**Status:** DRAFT spike. Not a product. No game is wired behind the cards. No Gaelic is certified.
**Live at:** <http://127.0.0.1:8787/spikes/hub-A/> on branch `dev/v2`.

---

## 1. What it is

A single screen: a child picks a game. A Hebridean shoreline at low evening sun — sea, skerry,
croft, tweed on the line, machair, cairn, rock pool — with Ruairidh an Ròn and a giomach in it,
and a snap-scrolling rail of eight game cards underneath.

Everything on screen is drawn in `index.html` as SVG paths and animated in `hub.css`. There are
exactly three files and three network requests, all same-origin:

| file | bytes | what it is |
|---|---|---|
| `index.html` | ~38 KB | markup + the whole scene as inline SVG |
| `hub.css` | ~17 KB | tokens, layout, parallax, idle motion, weather |
| `hub.js` | ~9 KB | viewBox fitting, parallax input, fps instrument, rail nav |

No images. No fonts. No CDN. No analytics. No storage. No cookies. Nothing is requested from a
third party at runtime — verified by capturing the network log (section 4).

## 2. Why it looks like this — the evidence it answers

Page numbers are the paged rendering of *User-Centred Design of Games for Gaelic Digital
Normalisation* (Macleod, Apr 2026) in `studio/briefs/inputs/`.

- **Visual appeal was the weak link in the pilot.** Q7 was the only engagement item without a
  clear top-scale majority — 11% rated the look just "OK" (p.55), while enjoyment was 94% and
  sustained interest 67%. The craft bar is the gap worth closing, not the mechanics.
- **Culture must be on the surface, not behind a `?`.** Only 2 of 18 pupils ever opened the
  seanfhacal help button (p.53, p.67). So the Gaelic here is *pinned to the artwork* with its
  English gloss underneath — a child reads `Tràigh / beach` without choosing to.
- **Animals, not people.** Non-human avatars support identification across a GME cohort that is
  more ethnically diverse than the visual stereotype (pp.34–35, after Felicya and Lestari 2024).
  Hence a seal and a lobster, and nobody's face.
- **Indexical, not decorative.** Harris Tweed and the cairn carry island identity without needing
  any Gaelic to decode (p.38, implemented in v1 at p.48). Both are in the scene and both are
  game cards.
- **Localise to the coast.** Beaches, rocks, seals, fishing boats, machair (p.37). P-7 in the
  pilot: "I felt like it was as if it was on our island" (p.61).
- **Cards 6–8 are the children's own ideas.** CalMac ferry driving, the blackening, "Guitar Hero
  but with bagpipes" (p.59). They are English placeholders with *(Gaelic title pending)* printed
  on the card, because no attested Gaelic exists for them yet and none was invented.
- **Not childish at 15.** A serif display face, a graded evening sky, restraint in the chrome.
  P-18 criticised existing Gaelic provision for being aimed at early primary (p.59).

## 3. Gaelic status — all PENDING

Twelve Gaelic strings are visible on the page and six more in the dev panel. Every one is a
PENDING row in `~/scotling-studio/studio/content/pending/visual-brand-designer-site-rows.json`
with its source URL. Nothing was generated. Sources are Am Faclair Beag headwords looked up on
16 Oct 2026, or strings that already shipped in v1 and appear in the dissertation with a page.

English is shown next to every Gaelic string **by design**, not as a fallback. That is a
deliberate departure from v1's FR1 (Gaelic-only, no English fallback, p.41) and the Gaelic Lead
and PM must rule on it: a hub that teaches `Machair / coastal plain` is doing different work
from a game loop that must stay Gaelic-first.

Four conflicts were found and are logged in that file rather than quietly fixed — including that
**v1 currently ships the cairn proverb in two different spellings in the same build**, and that
the dissertation names the seal both `Ruairidh a' Ròn` (p.38) and `Ruairidh an Ròn` (p.50).

## 4. Performance measured

Instrumented with a `requestAnimationFrame` counter exposed as `window.__hubFPS`; driven over
the DevTools protocol with synthetic pointer movement so the parallax path is exercised, then
sampled for 8 seconds in 500 ms windows (first two windows discarded as warm-up).

| run | min fps | mean fps |
|---|---|---|
| no throttle | 60 | 60.0 |
| 4× CPU throttle | 60 | 60.0 |
| 6× CPU throttle | 60 | 60.0 |

Scene cost: **203 SVG nodes, 31 animated nodes, 476 DOM nodes total.** Console errors: none.
Network requests: 3, all same-origin (`/`, `hub.css`, `hub.js`). `node --check` passes on `hub.js`.

How it stays cheap: every animation is `transform` or `opacity` only; parallax writes two CSS
custom properties at most once per frame and nine layers resolve them in `translate3d`; there are
no SVG filters, no `backdrop-filter`, no blurs, no box-shadows on animated elements, and no
`background-position` animation. `prefers-reduced-motion: reduce` disables the lot.

**This is not the acceptance test.** It was measured in headless Chrome 155 on a Mac at
1180×820, with CPU throttling as a stand-in for an older device. Safari rasterises SVG
differently and headless compositing is not a real display pipeline. **A 2018 iPad in Safari
must still be measured on the actual device** before this approach is chosen.

## 5. What it costs in hours

Solo founder, ~8 hours a week, Claude Code as the multiplier. Excludes native-speaker review,
voice recording and safeguarding sign-off, which are human and sequential.

| work | hours |
|---|---|
| Finish this hub to production (tokens, portrait art variant, routing, audio, a11y, QA) | 16–25 |
| **Extend Approach A to one full game** (scene art 6–10, mechanic + state 10–16, tutorial/help 4–6, audio hooks 2–3, Gaelic plumbing 2–3, a11y 3–4, device testing 3–4) | **30–46, call it 35** |
| Each additional card vignette, authored by hand at this quality | 0.75–1.25 |

So eight games at this standard is roughly **280 founder-hours ≈ 35 weeks at 8 h/week**, on top
of the hub. That is the honest shape of "100x more powerful" and the roadmap has to sequence it:
the three v1 games re-skinned first, then `Càrn` and `Clò na Hearadh`, then the child-proposed
three. Red Team should attack any plan that assumes otherwise.

The pipeline cost is in *drawing*, not code. Authoring SVG by hand is slower per asset than
buying stock and is the reason it is licence-clean — there is no Freepik dependency and no
paid tool anywhere in it.

## 6. What it needs from the design system

`studio/pods/design/design-system.md`, `studio/pods/product/site-v2-spec.md` and
`studio/pods/design/world-bible.md` did not exist when this was built. Everything below is a
provisional decision made here that must be revisited when they land — each one is marked
`PROVISIONAL` in `hub.css`.

1. **Thistle gold.** Used `#E3B23C` (plus `#F0D79A` light, `#B8862A` deep). Needs a ruling.
2. **Thistle purple** `#7D5BA6` as a tertiary, used only for machair wildflowers.
3. **The Saltire ramp.** `#185FA5` is fixed by the constitution; the four tints and shades
   around it here are invented and need a real ramp with contrast ratios.
4. **Type.** System stack only — `Iowan Old Style / Palatino / Georgia` display, system sans for
   UI. It renders à è ì ò ù correctly (proof strip in the dev panel, press `D`). But T-1 asked
   for **dyslexia-friendly fonts** (p.56, p.67) and that needs a licence-clean self-hosted face
   downloaded at build time with its licence recorded — a design-system decision, not a spike one.
5. **Scale tokens** — radii, spacing, motion durations and easing, focus-ring spec.
6. **Minimum tap target and contrast floor** for a 6-year-old on a shared, smeared classroom iPad.
7. **Character canon** (world bible): Ruairidh's and Giomach's proportions, palette and
   expression range. The two drawn here are placeholders, not canon.
8. **Status pill taxonomy** — "In v1 / New in v2 / Concept" is a guess at the product's language.

## 7. Known gaps

- **Portrait framing.** On a tall screen the scene fits everything in, which leaves a wide quiet
  band of machair above the rail. It is not ugly but it is not composed. A portrait art variant
  with repositioned elements is needed; tracked here, not solved.
- **Safari 14 floor.** Rotations use `transform-box: fill-box`. Below Safari 14 the grass, tweed
  and claw would pivot about the wrong point. A 2018 iPad on iPadOS 15+ is fine; anything older
  is not.
- **No audio.** Ruairidh's narration slots are not wired.
- **The cards go nowhere.** Clicking one updates a status line and says so plainly. No dark
  pattern, no fake loading, no "coming soon" nag.
- **Not compared against Spike B.** This measures Approach A only. The choice between approaches
  belongs to the design pod with the engineer's build-cost view alongside.

## 8. Licence

All artwork, CSS and JavaScript in this folder were authored by hand for Scotling by role 12.
No stock imagery, no Freepik, no third-party fonts, no third-party code, no paid tool. Nothing
needs a licence register entry because nothing was brought in.

---
*Spike A · visual-brand-designer (role 12, pod design) · 16 October 2026 · branch `dev/v2`.
Not deployed. Deploying anything is a Founder Card yes/no (Constitution 7.7.3).*
