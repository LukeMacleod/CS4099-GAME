# Art-direction Spike B — the V2 game hub, in canvas

**Role 12 (visual and brand designer), pod design. 16 October 2026. Branch `dev/v2`.**

**Abstract.** Decides nothing. Shows one answer to the founder's "Mario Kart level graphics"
bar for the screen where a child picks a game, built the way Approach B was specified: Canvas
2D, 2.5D depth layers, lighting, particles, a hub carousel. Assumes only the founder directive
of 16 Oct 2026 and the landed `design-system.md`, `design-tokens.json`, `world-bible.md` and
`site-v2-spec.md`; it does **not** assume the architecture decision still before the Board,
because it is a self-contained page that routes nowhere. Depends on it: the A-vs-B art-direction
choice, and the hours estimate in §5.

Open it at <http://127.0.0.1:8787/spikes/hub-B/>. Spike A, the SVG + CSS answer to the same
brief, is next door at `../hub-A/`.

---

## 1. What it is

A single screen: a Hebridean harbour at the end of the day, and a carousel of eight game cards
turning through it. Everything inside the canvas is drawn procedurally by `hub.js` at runtime —
sky gradient and sun bloom, two parallax ridgelines, a lighthouse, the sea and its skerries,
foreground marram grass, Ruairidh the seal, every card and every piece of card art. There is no
image file in this folder. There is no image file anywhere in this spike.

| | |
|---|---|
| Files | `index.html`, `hub.css`, `hub.js`, `gaelic-pending.json` |
| Over the wire, gzipped | **~28 KB total** — about one twentieth of a single photograph |
| Runtime dependencies | none: no npm package, no CDN, no framework, no webfont |
| Network calls after load | one, same-origin: `gaelic-pending.json` (see §3) |
| Raster or stock assets | none |
| Third-party trackers, analytics, ads | none |

PixiJS was permitted by the brief and was not used. At this scene complexity the whole paint
costs 0.7 ms (§4), so a renderer would have bought nothing and cost a dependency, a licence row
and a build step. If V2 later needs hundreds of sprites with batched draw calls, that is the
moment to revisit it — not now.

### The 2.5D, concretely

Depth is not a style here, it is seven cues stacked, which is what separates this from a flat
2D hub:

1. **Parallax layers** — far ridge, near ridge, sea, cards, foreground grass, each displaced by
   a different fraction of the pointer position and of the carousel's own rotation.
2. **Perspective scale** on the cards: `1 / (1 + 0.42·distance)`, not a linear shrink.
3. **A horizontal squash plus a vertical shear** per card, which is what sells a flat rectangle
   as a plane turning away from you.
4. **Depth fog** — a blue wash whose alpha rises with distance. This is the single cue doing the
   most work; remove it and the hub collapses into a row of stickers.
5. **Contact shadows and reflections** on the water, both fading with depth.
6. **A rim light** on each card, warm on whichever edge faces the sun.
7. **A graded vignette** over the whole frame, multiply-blended.

Lighting is one sun at a fixed position, used four ways: the sky bloom, the volumetric shafts
(tier 3 only), the per-card rim light, and the final warm lift. Particles are three pooled
systems — sea spray off the skerries (180 / 90 / 36 by tier), midges in the foreground
(150 / 70 / 0), and light rain (320 / 150 / 60), allocated once at load and never reallocated.
All three are switchable in the dev HUD so a reviewer can see what each one is worth.

### What a child does with it

Drag, swipe, arrow keys, Tab, or click a card. The carousel is critically damped: it is thrown,
it settles, it never snaps. The selected card lifts, warms, and glows gold. Ruairidh surfaces
bottom-left and offers a short pragmatic idiom in a speech bubble, Gaelic over its English
gloss, changing every five seconds.

Selecting a card changes the card's state and nothing else. This is a **look** spike, not a
router: it deliberately takes no position on the V2 architecture question.

---

## 2. Why it looks like this

Not a mood board. Each choice below answers something in the evidence.

- **A harbour at golden hour, not a generic cartoon sea.** The dissertation's whole argument is
  that the Gaelic has to live in the mechanics and the setting, not in a translated UI layer
  (CLAUDE.md §4.5). The setting is the first thing a child reads, before any text.
- **Ruairidh an Ròn is on the screen, not in a menu.** He is the established guide (dissertation
  p.38, p.51) and the world bible fixes him as the cast's constant. Eighteen recorded lines of
  him already exist in the product repo. A hub that hid him would be throwing away the one
  character a pilot child already knows.
- **Idioms, not instructions, in the speech bubble.** The dissertation's own rationale (p.48) is
  that these are short enough to need no reading comprehension. "duda?" is in the rotation
  because it was the single highest-impact string in Pilot 1 — it triggered grandparent and
  parent recall across multiple children (p.61, Theme 4), which is the intergenerational bridge
  the project's ground truth names as its emergent finding.
- **Eight cards, three of them labelled "In v1".** The founder directive asks for more game
  selection. Showing the three shipped games beside five honest "Concept" cards makes the
  expansion legible without implying work that does not exist. Three of the five concepts
  (Ferry Run, Peat Road, Pipe Rhythm) are the children's own ideas from Pilot 1 (p.59, Theme 2),
  not inventions of mine.
- **Not childish at 15.** No bouncing primaries, no comic outlines, no exclamation marks. The
  palette is dusk-blue and gold, the motion is weighted and damped, the type is quiet. The joy
  is in the light and the movement, which is the register that holds across 6 to 15. The
  dissertation's P6–7 cohort is the evidenced one; the 13–16 band (CLAUDE.md §4.7) is **not**
  evidenced here and this spike is a guess at it, not a finding.
- **No dark patterns.** No streak, no timer, no countdown, no badge, no "3 left", no red dot.
  The status pips read "In v1" and "Concept" and carry no urgency. Nothing is stored, so nothing
  can be held hostage.

---

## 3. Gaelic status — every string PENDING

> **Gaelic pending native-speaker review.** This note is deliberately here and in a developer
> comment at the top of `index.html`, and deliberately **not** on the page: it is a studio
> process fact, not something a child should read.

**No Gaelic string lives in `hub.js` or in `index.html`.** The product repo's `CLAUDE.md` says
so, and the production content pipeline (`scripts/build-content.mjs`) correctly *excludes*
PENDING rows, because nothing unverified may reach a child — so a review spike cannot be fed by
it. This page therefore loads its Gaelic from `gaelic-pending.json` in this folder, generated
from the studio's PENDING rows. **If that file fails to load, the page renders English only.**
It never falls back to an unreviewed Gaelic string baked into the script, which is the failure
mode the rule exists to prevent; the fallback is tested, not assumed (§4).

No Gaelic on this screen was generated. Every string is quoted verbatim from the dissertation's
paged rendering with its page number, and carries the source URL the dissertation's own
bibliography gives for it. The 17 rows are filed as PENDING in
`~/scotling-studio/studio/content/pending/visual-brand-designer-site-rows.json` (ids `VBD-*`;
spike A's rows are `hubA.*` in the same file). Every Gaelic string on screen has its English
gloss rendered next to it, always, at every card size and in every speech bubble.

Only the Gaelic Language Lead may change `gaelic` or `source_url`. No agent can certify Gaelic
as correct (entrenched article 7.7.2), so nothing here is certified.

**Sourcing these 16 strings found six places where the project disagrees with itself.** That is
the most useful output of this spike and it is logged as conflicts C5–C8 in the rows file:

| Row | The disagreement |
|---|---|
| `VBD-003` | The shipped game title exists in **three** forms: the dissertation body (p.39, p.103), the LearnGaelic headword it cites (`cho coltach ri chèile ri dà sgadan`, p.76), and a typo in v1's `game.js` (`Cho Coltrach ris an Dà Sgadan`). Highest priority — it is a live product string. |
| `VBD-005` | The cairn seanfhacal is printed two ways in the dissertation (p.47 `càirn … beaga` vs p.101 `càrn … bheaga`) and v1 ships both. |
| `VBD-006` | `trì seòid a' mhara` (dissertation p.97) vs `trì seòid a' chuain` (the Faclair na Gàidhlig headword it cites, p.75) — and the dissertation glosses `rionnach` as *herring* when it is *mackerel*. The world bible glosses it mackerel, agreeing with the dictionary, but cites p.110, where the proverb does not appear. |
| `VBD-013`, `VBD-018` | `nise` vs the cited headword `a-nise`; `haoidh` vs the in-game `haoi!`. |
| `VBD-015`, `VBD-017` | `obh obh` and `aidh aidh` are shipped in v1 and appear in the dissertation's own figures (p.48) but have **no dictionary citation anywhere in it**. They are the weakest-sourced strings on screen in either spike. |

The spike renders one form and records the other. It resolves none of them.

Live GETs to `learngaelic.scot` and `faclair.com` on 16 Oct 2026 were rate-limited or returned
no parseable entry, so **no row claims a URL verified to resolve today**; each is flagged for the
Lead to open. Logged in `studio/RUN_LOG.md`.

### The type proof is a test, not a claim

à è ì ò ù and their capitals are brand-critical and a missing glyph on a canvas fails silently —
it falls back to notdef, which still paints. So the page measures instead of asserting: at load
it compares the advance width of each accented glyph against its unaccented base on **both**
surfaces, canvas and DOM, at **12, 20 and 34 px** — 10 forms × 3 sizes × 2 surfaces, 60 checks —
and prints the verdict in the footer. Current result in Chrome 155 on macOS: **PASS, 60 of 60.**
It is a live test: if a future font choice breaks the graves, this page says so on sight.

Two defects in this proof were found and fixed while writing it up, and both are worth recording
because they are the kind that survive review. (1) The proof measured at one size (32 px) on one
surface while its verdict line claimed three sizes on two — an unearned claim, now an earned one.
(2) The visible specimen strip used the selectors `.glyphs .g12` where the markup is
`class="glyphs g12"`, so the size rules matched nothing and the strip rendered all three
"sizes" identically. A type proof that silently proves nothing is worse than no type proof.

The specimen is deliberately **letters** — à beside a, è beside e — because that pairing is what
lets an eye catch a notdef box. The one real word in it, *Gàidhlig*, is an attested PENDING row
(`VBD-021`) injected at runtime like everything else.

---

## 4. Performance measured

Measured 16 Oct 2026 via the Chrome DevTools Protocol against Chrome 155 headless on an Apple
Silicon Mac, software rendering (`--disable-gpu`), viewport 1366×768 at dpr 1 — deliberately the
Chromebook's resolution rather than a Retina canvas.

**Frame rate (real `requestAnimationFrame` deltas, 4 s per tier):**

| Tier | mean fps | frame p50 | frame p95 |
|---|---|---|---|
| 3 — high (shafts, 180 spray, 150 midges, dpr≤2) | 56.8 | 16.7 ms | 33.3 ms |
| 2 — medium (no shafts, 90 spray, 70 midges, dpr≤1.5) | 60.0 | 16.7 ms | 16.7 ms |
| 1 — low (no reflections, 36 spray, no midges, dpr 1) | 60.0 | 16.7 ms | 16.7 ms |

**Cost of the paint itself** (`frame()` called directly in a loop, so the 60 Hz vsync ceiling is
excluded — this is the number that matters for headroom):

| Tier | p50 | p95 | worst |
|---|---|---|---|
| high | 0.7 ms | 0.9 ms | 1.9 ms |
| medium | 0.5 ms | 0.7 ms | 1.3 ms |
| low | 0.3 ms | 0.4 ms | 0.7 ms |
| medium, CPU throttled ×6 | 2.8 ms | 6.4 ms | 6.4 ms |
| low, CPU throttled ×6 | 2.4 ms | 3.9 ms | 3.9 ms |

JS heap after two minutes: **1.7 MB**, flat — the particle pools are allocated once and the card
line-breaking is memoised, so there is nothing per-frame for the collector to take back.

**Degradation, tested not asserted.** A school Chromebook will not announce itself as weak; it
will simply miss frames. So the device sniff (`hardwareConcurrency`, `deviceMemory`) only picks a
*starting* tier, and the real decision is a frame-rate watchdog: two seconds under 45 fps drops a
tier; three consecutive half-seconds under 22 fps falls all the way to a single painted still and
stops the loop. Under CPU throttling ×10 the page reached the still image in **under 9 seconds**,
with no visual tearing and no dropped interaction.

**And degradation is reversible**, which is the part most such watchdogs get wrong. What trips it
on a school machine is very often temporary — another tab waking, a sync, a cold start, a teacher
switching displays. A hub that froze permanently on the first bad three seconds would leave a
child with a dead picture for the rest of the lesson and nothing on screen to explain it. So while
quality is on Auto the page retries: it thaws at the lowest animated tier, lets the same watchdog
judge it again, and backs off 20 s → 40 s → 80 s … capped at five minutes. Returning to the
foreground forgives the backoff immediately, because a backgrounded tab starves `rAF` and looks
exactly like a weak machine. Measured: frozen under throttle ×10, throttle released, **recovered
to 60 fps at tier 1 within 15 s**. A machine that is genuinely slow settles on the still image
after a few attempts and stops burning battery. Choosing "Static frame" by hand is respected and
never retried.

Once recovered the page stays at tier 1 and does not climb back to 2 or 3. That is deliberate —
oscillating between tiers in front of a child is worse than staying low — and it is a decision
the design system should confirm rather than inherit from me.

**The English-only fallback is tested.** With `gaelic-pending.json` blocked at the network
layer, the page loads, runs at 60 fps, shows eight cards with English names only, hides the
Gaelic strapline line and replaces its source line with "Gaelic not loaded — English only",
Ruairidh says nothing rather than speaking from the script, and a single `console.warn` explains
it to a developer. Zero Gaelic strings reach the screen. No exception is thrown.

**Two caveats, stated plainly.** CPU throttling in DevTools is a proxy for a Chromebook, not a
Chromebook; and all of the above is one machine, one browser, one session. Before this approach
is chosen, it needs 20 minutes on real hardware: a school Chromebook and a shared iPad, warm and
cold, on battery. That is a QA task, not a design one.

Not measured here: battery draw, thermal behaviour over a 20-minute classroom slot, and the
page's behaviour on a genuinely patchy connection (it loads 26 KB once and then never touches
the network, so the last one should be its strongest card — but "should" is not "measured").

---

## 5. What it costs in hours to extend to a full game

Honest estimates, in **founder-hours with Claude Code**, at the ~8 hours a week the PM is sizing
against. Hours are for the *visual* work; game logic, audio, content and Gaelic review are not in
these numbers.

### 5a. Finishing this hub as a production screen

| Work | Hours |
|---|---|
| Wire cards to real routes; loading and error states | 3–4 |
| Keyboard and screen-reader pass against `accessibility-requirements.md`; focus ring on canvas elements | 4–6 |
| Adopt the ratified tokens and self-host Baloo 2 / Atkinson Hyperlegible (§6) | 3–4 |
| Real card art for 8 games, in this procedural style, at this quality | 10–14 |
| Dark/low-light and reduced-motion variants; reduced-motion is stubbed, not designed | 2–3 |
| Test on real Chromebook + shared iPad, fix what that finds | 4–6 |
| **Total** | **26–37 hours** — about 4 to 5 founder-weeks |

### 5b. Extending the approach to one new full game

| Work | Hours |
|---|---|
| Environment in this style (new ridgeline, water, light, 3 depth planes) | 8–12 |
| One character with 3 idle/react states, procedural | 10–16 |
| Interaction art: hit states, success/failure particles, score motion | 8–12 |
| HUD and modals from the component library (cheap *if* §6 lands) | 3–5 |
| Polish to the standard this spike sets | 6–10 |
| **Total per game** | **35–55 hours** — 5 to 7 founder-weeks |

### 5c. The number that actually decides this

Procedural art has a different shape from drawn art: **high fixed cost, near-zero marginal
cost.** Every one of those hours is mine-or-the-founder's, in code, under version control, with
no licence, no subscription, no attribution and no file to lose. Against the asset-licence
position in `design-system.md` §3 — 74 of 124 deployed assets with no licence on file, Premium
Freepik licences issued to Luke Macleod personally and non-transferable to a company — that is
not a stylistic preference, it is the cheapest route out of a real blocker.

The honest counterweight: **this style is hard to hand off.** A freelance illustrator can be
briefed to draw a seal. Nobody can be briefed to write 180 lines of canvas that draw a seal, so
this approach binds the art to whoever writes the code. If the roadmap ever assumes an
illustrator, spike A (SVG + CSS, editable in any vector tool) is the approach that survives that
and this one is not. **That trade, not the pixels, is the real A-vs-B decision.**

---

## 6. What it needs from the design system

`design-system.md`, `design-tokens.json`, `world-bible.md` and `site-v2-spec.md` all landed while
this was being built. Where the spike already matches them it says so; where it does not, the
spike is wrong and must be revisited.

### Adopted
- Saltire blue `#185FA5` and its ink `#0E3C6B` are the card and sea base.
- Ruairidh an Ròn as the constant guide, per the world bible's returning cast.
- English always alongside Gaelic; status pips carry no urgency (ICO Children's Code, §4.3).

### Divergences this spike must fix — each one is a real debt, not a style opinion

1. **Gold.** The spike uses `#E8B33A` / `#F7D27A`. The ratified token for thistle-gold is
   **`#C9992C`**. The spike's gold was chosen for contrast against a dusk-blue canvas and is
   lighter; the token must win, and if `#C9992C` does not hold 4.5:1 against the card surfaces,
   that is a finding for the design system, not a licence to keep mine.
2. **Type.** The spike is system-stack only, which is why the grave proof passes everywhere. The
   tokens specify **Baloo 2** (display) and **Atkinson Hyperlegible** (body), both SIL OFL 1.1.
   Both must be **downloaded at build time and self-hosted** — never fetched from a Google Fonts
   CDN at runtime (§4.3, and `fonts.gstatic.com` is a third-party request from a child's
   browser). The OFL licence text ships with the files. The grave-accent proof in this page then
   becomes the acceptance test for that swap, and it must be re-run on a real Chromebook.
3. **The Saltire-blue drift is unresolved.** `design-system.md` §2 records that live scotling.com
   ships `#5562F6`/`#60B4F9`, not `#185FA5`. This spike assumed `#185FA5`. If the Founder Card
   resolves the other way, the whole scene regrades. **Revisit on that decision.**
4. **Contrast is unverified.** No pair on this canvas has been contrast-checked. Canvas text is
   invisible to every automated checker, so this needs a manual sampling pass against
   `accessibility-requirements.md`. Treat the current page as failing until it is done.
5. **Reduced motion is honoured but not designed.** `prefers-reduced-motion` paints one good
   frame and stops. A child who needs that setting currently gets a still image and no
   alternative affordance. The design system should say what reduced-motion joy looks like.

### What the design system has to supply before this becomes product

- **A canvas-token bridge.** CSS custom properties cannot reach a canvas context. The spike
  hardcodes a `BRAND` object; production needs the tokens read once from the stylesheet and
  handed to the renderer, so there is one source of truth and not two. The same problem is
  already solved here for Gaelic — the strings come from a generated file, not from the script
  (§3) — and colour should follow the same shape.
- **A PENDING-content route for design spikes.** `scripts/build-content.mjs` is right to exclude
  PENDING rows from anything child-facing, but that leaves review spikes with nowhere to draw
  from, and this one solved it locally by generating `gaelic-pending.json` by hand. If more
  spikes follow, that generation belongs in the pipeline behind an explicit
  `--include-pending --not-for-children` flag, so the exclusion rule stays the default and the
  exception stays visible.
- **A title-length rule.** Gaelic game titles are long: `Nithear càirn mòr bho chlachan beaga` is
  36 characters where `Trap the Lobster` is 16. The card is now built around the title — it
  measures first and shrinks the picture to 40 % of the card when the title needs three lines, so
  neither language is cropped. That is a sound default but it is *my* default. The design system
  should set the rule: maximum title length, minimum picture height, and what happens past both.
  The page logs any title it has to truncate to `console.info` rather than hiding it.
- **A focus-ring spec for canvas-drawn controls.** The accessible mirror list is real — Tab
  reaches it, it carries a `:focus-visible` ring, and focusing an item rotates the carousel to
  match. But on the canvas itself the selected card is marked only by its gold border and glow,
  which is a *selection* cue, not a focus indicator, and has not been contrast-checked. A canvas
  carousel needs that spelled out once, for every game that reuses it.
- **A motion spec.** `design-system.md` §1 promises a `celebratory` motion token. The carousel's
  damping constants here are tuned by eye and should come from that token set.

---

## 7. Known gaps

- Selecting a card does nothing but select it. By design — see §1.
- The 13–16 register is an assertion, not a finding. No evidence in this project covers it.
- The accessible card list mirrors the carousel but has not been through a screen reader.
- No audio. Ruairidh has 18 recorded lines in the product repo and their performer release is
  unresolved (`world-bible.md`, V-006), so this spike stays silent rather than prejudge it.
- Side cards in the carousel are partly occluded by nearer ones. That is correct 2.5D behaviour,
  but it means a child cannot read every title at once; whether that is acceptable is a UX
  question for the interaction model, not a bug to fix here.
- One browser, one machine, one session (§4).

---

## 8. Licence

Everything in this folder was authored for Scotling by role 12 on 16 October 2026 and contains no
third-party code, fonts, images or data. No asset in it requires a licence, an attribution or a
subscription. Nothing is loaded from a third-party origin at runtime. There is nothing here to
licence-audit — which is the entire point of the exercise.

---

## 9. How to re-run every check in this file

```sh
# serve
python3 -m http.server 8787 --bind 127.0.0.1 --directory ~/scotling-v2/public

# syntax
node --check ~/scotling-v2/public/spikes/hub-B/hub.js

# the page
open http://127.0.0.1:8787/spikes/hub-B/
```

The frame-rate, degradation, recovery and English-only-fallback numbers in §4 were taken over
the Chrome DevTools Protocol (`Emulation.setCPUThrottlingRate`, `Network.setBlockedURLs`,
`Runtime.evaluate`), not from the on-page counter, although the on-page counter agrees with them.
The on-page HUD is there so a reviewer with no tooling can see the same thing: it shows live fps,
the current tier, and — when the page has fallen back — how long until it retries.

## 10. Change log

- **16 Oct 2026** — built (canvas 2D, 2.5D, 8 cards, 3 particle systems, tiered degradation).
- **16 Oct 2026** — card titles: fixed overflow past the card edge; cards now measure the Gaelic
  title first and shrink the picture so neither language is cropped.
- **16 Oct 2026** — degradation made reversible, with backoff; measured recovery in 15 s.
- **16 Oct 2026** — all Gaelic moved out of `hub.js` and `index.html` into `gaelic-pending.json`;
  English-only fallback added and tested.
- **16 Oct 2026** — type proof corrected: now measures 60 checks across both surfaces and three
  sizes, and the specimen strip's size rules actually apply.
