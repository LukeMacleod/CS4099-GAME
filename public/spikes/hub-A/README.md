# Art-direction Spike A — the V2 game hub

**Decides:** that "Mario Kart level graphics" can be answered with hand-authored layered SVG
plus CSS animation, with no WebGL, no raster assets, no paid tool and no licence risk.
**Assumes:** a 2018 iPad in Safari is the floor device, and the hub must stay beautiful when
every Gaelic string on it is still unverified.
**Depends on it:** the design system's colour/type tokens, the world bible's character canon,
and the product spec's game list — all three have now landed (DRAFT) and pass 2 reconciles
against them; see section 6.
**Status:** DRAFT spike. Not a product. No game is wired behind the cards. No Gaelic is certified.
**Live at:** <http://127.0.0.1:8787/spikes/hub-A/> on branch `dev/v2`.

---

## 1. What it is

A single screen: a child picks a game. A Hebridean shoreline at low evening sun — sea, skerry,
croft, tweed on the line, machair, cairn, rock pool — with Ruairidh an Ròn and a giomach in it,
and eight game cards underneath: a snap-scrolling rail in landscape, a two-column scrolling grid
in portrait.

Everything on screen is drawn in `index.html` as SVG paths and animated in `hub.css`. There are
exactly three files and three network requests, all same-origin:

| file | bytes | what it is |
|---|---|---|
| `index.html` | ~38 KB | markup + the whole scene as inline SVG |
| `hub.css` | ~22 KB | tokens, layout, parallax, idle motion, weather, portrait grid |
| `hub.js` | ~10 KB | focal-point viewBox fit, parallax input, fps instrument, rail nav |

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
sampled for 8 seconds in 500 ms windows (first two windows discarded as warm-up). Re-measured
after the pass-2 changes (token swap, portrait grid, focal-point fit).

| run | viewport | min fps | mean fps |
|---|---|---|---|
| no throttle | 1180x820 landscape | 60 | 60.0 |
| 4x CPU throttle | 1180x820 landscape | 60 | 60.0 |
| 6x CPU throttle | 1180x820 landscape | 60 | 60.0 |
| 6x CPU throttle | 810x1080 portrait (two-column grid) | 58 | 59.9 |

Scene cost: **203 SVG nodes, 31 animated nodes, 477 DOM nodes total.** Console errors: none in
any run. Network requests: 3, all same-origin (`/`, `hub.css`, `hub.js`). `node --check` passes
on `hub.js`.

How it stays cheap: every animation is `transform` or `opacity` only; parallax writes two CSS
custom properties at most once per frame and nine layers resolve them in `translate3d`; there are
no SVG filters, no `backdrop-filter`, no blurs, no box-shadows on animated elements, and no
`background-position` animation. `prefers-reduced-motion: reduce` disables the lot.

**This is not the acceptance test.** It was measured in headless Chrome 155 on a Mac, with CPU
throttling as a stand-in for an older device. Safari rasterises SVG differently and headless
compositing is not a real display pipeline. **A 2018 iPad in Safari must still be measured on the
actual device** before this approach is chosen.

## 5. What it costs in hours

Solo founder, ~8 hours a week, Claude Code as the multiplier. Excludes native-speaker review,
voice recording and safeguarding sign-off, which are human and sequential.

| work | hours |
|---|---|
| Finish this hub to production (portrait art variant, routing, audio, a11y, QA) | 14–22 |
| Swap to the design system's Baloo 2 + Atkinson Hyperlegible once ratified (self-hosted, licence recorded) | 1–2 |
| **Extend Approach A to one full game** (scene art 6–10, mechanic + state 10–16, tutorial/help 4–6, audio hooks 2–3, Gaelic plumbing 2–3, a11y 3–4, device testing 3–4) | **30–46, call it 35** |
| Each additional card vignette, authored by hand at this quality | 0.75–1.25 |

So eight games at this standard is roughly **280 founder-hours ≈ 35 weeks at 8 h/week**, on top
of the hub. That is the honest shape of "100x more powerful" and the roadmap has to sequence it:
the three v1 games re-skinned first, then `Càrn` and `Clò na Hearadh`, then the child-proposed
three. Red Team should attack any plan that assumes otherwise.

The pipeline cost is in *drawing*, not code. Authoring SVG by hand is slower per asset than
buying stock and is the reason it is licence-clean — there is no Freepik dependency and no
paid tool anywhere in it.

## 6. Reconciliation with the design system, world bible and site spec

Pass 1 was built before `studio/pods/design/design-system.md`,
`studio/pods/design/design-tokens.json`, `studio/pods/design/world-bible.md` and
`studio/pods/product/site-v2-spec.md` existed, so every non-Saltire colour was marked
PROVISIONAL. All four have now landed as DRAFT. Pass 2 reconciles against them. Nothing in this
folder is labelled PROVISIONAL any more: a value is either **TOKEN** (taken from the token file
verbatim) or **GAP** (the token file has no answer, with the measured reason written in `hub.css`
next to it).

### 6.1 Adopted from `design-tokens.json`

| what | was | now |
|---|---|---|
| thistle gold | `#E3B23C` (invented) | `#C9992C` — `color.brand.thistle-gold` |
| gold tint | `#F0D79A` (invented) | `#F6ECD4` — `color.brand.thistle-gold-tint` |
| radii | 9 / 14 / 20 px | 8 / 16 / 24 / 999 — `radius_px` |
| easing | `cubic-bezier(.22,.61,.36,1)` | `cubic-bezier(0.22, 1, 0.36, 1)` — `motion.easing` |
| durations | hard-coded `.18s`/`.2s`/`.26s` | `--t-micro` 120 / `--t-standard` 240 / `--t-celebratory` 480 |
| brand mark centre | `#E3B23C` | `#C9992C` |

### 6.2 Two contrast defects this reconciliation found

Both are reported rather than quietly worked around, per the token file's own `contrast_rule`.

1. **`color.semantic.focus-ring` (`#185FA5`) cannot be used on a dark surface.** Measured against
   this hub's chrome it is **2.80:1** on the rail and **2.30:1** on a card face, below the WCAG 2.2
   **3:1** non-text floor. `hub.css` aliases `--focus-ring` to the gold (7.02:1 / 5.78:1) and says
   why. **The design system needs a second focus-ring value for dark surfaces.**
2. **This spike was itself shipping an AA failure.** The "New in v2" pill used `#2E7CC4` behind
   white 9.9px bold text: **4.38:1**, below the 4.5:1 floor. Fixed to true Saltire blue `#185FA5`
   at **6.52:1**.

### 6.3 Still open — not settled by the landed documents

1. **The Saltire-blue drift.** `design-system.md` §5.1 raises it as a Founder Card decision:
   `#185FA5` (Constitution §3) vs the `#5562F6`/`#60B4F9` the live site actually ships. This page
   uses `#185FA5`. If the founder rules the other way, every blue here changes.
2. **Type.** `design-tokens.json` names **Baloo 2** (display) and **Atkinson Hyperlegible**
   (body/UI), both SIL OFL 1.1, the second chosen because the dissertation's own trial teacher
   asked for a dyslexia-friendly face (p.70). The constitution permits a build-time font download
   with the licence recorded, so this is allowed — but this spike deliberately **does not adopt it
   yet**: `design-system.md` is DRAFT, its own `glyph_check_status` is `[VERIFY]`, and committing
   ~200 KB of binaries to a public repo against an unratified type decision is the wrong order.
   The system stack renders à è ì ò ù correctly today (proof strip in the dev panel, press `D`).
   Cost of the swap once it ratifies: **1–2 hours** including the licence-register entry.
3. **No dark-surface ramp.** The token file ships one surface family and it is light
   (`surface-000` .. `surface-050`). This hub is a dark UI, so `--gold-lift`, `--ink` and the two
   panel values are derived locally, at the thistle-gold hue, with their ratios written in
   `hub.css`. **Request: publish a dark-surface ramp, or rule that the hub must be a light UI.**
4. **Character canon.** `world-bible.md` fixes the name **Ruairidh an Ròn** (which is what this
   page uses) but carries no visual canon — no proportions, palette or expression range. The seal
   and the lobster drawn here are still placeholders. The world bible also names **an rionnach**
   (the mackerel) as the evidenced third character, from the proverb at p.110; not drawn here.
5. **Scene art is not tokenised** and arguably should not be. Sky, sea, sand, machair and night
   stay local to this spike under `GAP 3` in `hub.css`.
6. **Status-pill taxonomy.** "In v1 / New in v2 / Concept / Needs consultation" is still this
   spike's guess at the product's language. Site spec §2 does not cover the hub.

### 6.4 What the world bible changed on the page

`world-bible.md` §3 flags the blackening specifically: it is an adult community custom involving
mess and mock-capture, and Harbord et al.'s "not all cultural knowledge should be gamified"
(dissertation p.31) applies directly — it needs community and parent consultation before any build
decision, "not a default yes because a child liked the idea". That card no longer sits in the rail
looking like a planned game: it carries the caveat on its face and a distinct **Needs
consultation** status.

## 7. Known gaps

- **Portrait is now composed, not just fitted** (closed in pass 2). A 0.75-aspect iPad cannot show
  a 2.08-aspect shoreline without spending the spare height on something, and pass 1 spent it on
  empty sky. Pass 2 lifts the scene's focal point and gives the freed space to the games: in
  portrait the rail becomes a **two-column grid that scrolls vertically**, which is also the better
  way to choose from eight things on a tall screen. Landscape is unchanged. What is still missing
  is a genuine **portrait art variant** with elements repositioned for a tall frame; the current
  fit is good, not composed.
- **Safari 14 floor.** Rotations use `transform-box: fill-box`. Below Safari 14 the grass, tweed
  and claw would pivot about the wrong point. A 2018 iPad on iPadOS 15+ is fine; anything older
  is not.
- **No audio.** Ruairidh's narration slots are not wired. The world bible also flags that no
  performer release is on file for the existing recordings (V-006) — a Founder Card item.
- **The cards go nowhere.** Clicking one updates a status line and says so plainly. No dark
  pattern, no fake loading, no "coming soon" nag.
- **Not compared against Spike B.** This measures Approach A only. The choice between approaches
  belongs to the design pod with the engineer's build-cost view alongside.
- **No agent has reviewed this.** Constitution 7.7.5: no agent approves its own work.

## 8. Licence

All artwork, CSS and JavaScript in this folder were authored by hand for Scotling by role 12.
No stock imagery, no Freepik, no third-party fonts, no third-party code, no paid tool. Nothing
needs a licence register entry because nothing was brought in.

## 9. Change log

**Pass 1 — 16 Oct 2026.** Scene, cards, parallax, weather, dev panel, 18 PENDING Gaelic rows.

**Pass 2 — 16 Oct 2026.** Reconciled against the design system, token file and world bible now
that they have landed (section 6). Adopted the real thistle-gold, radii, easing and motion
durations. Found and reported two contrast defects, one of them this spike's own. Replaced the
viewBox centre-fit with a focal-point fit and gave portrait a two-column card grid, closing the
dead-band gap pass 1 logged. Moved the Machair label out of the Càrn label. Gave the blackening
card the world bible's consultation caveat. Re-measured: 60 fps landscape at 1x/4x/6x, 58 min in
portrait at 6x, no console errors, still three same-origin requests. **No Gaelic was added,
changed or generated in pass 2** — the 18 PENDING rows are unchanged.

---
*Spike A · visual-brand-designer (role 12, pod design) · 16 October 2026 · branch `dev/v2`.
Not deployed. Deploying anything is a Founder Card yes/no (Constitution 7.7.3).*
