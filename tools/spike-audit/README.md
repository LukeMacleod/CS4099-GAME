# spike-audit

A measuring tool, not a linter. It exists so the Board decides art direction on evidence rather
than on what a spike's own README claims about itself.

Written by role 23 (red team critic) during the hub-A / hub-B duel, 16 October 2026. Every number
in `~/scotling-studio/studio/governance/board/duel-hub-spike-judge-red-team-critic.md` is
reproducible with one command.

```sh
python3 -m http.server 8787 --bind 127.0.0.1 --directory public   # in another shell
node tools/spike-audit/audit.mjs            # every page in regions.json
node tools/spike-audit/audit.mjs hub-A      # one page
node tools/spike-audit/audit.mjs --json     # machine-readable
```

## What it measures and why each one is here

| Check | Why it earns its place |
|---|---|
| Off-origin requests | CLAUDE.md §4.3. A runtime CDN font is a third-party request from a child's browser. The number that matters is zero, and it should be proved on every build, not asserted once. |
| Cookies and web storage | ICO Children's Code, high-privacy default. Nothing stored means nothing to hold hostage. |
| `<html lang>`, first heading, skip link | The three things a screen reader in a GME classroom hits first. A majority-English page declared `lang="gd"` makes a reader pronounce the English glosses with Gaelic rules. |
| Tab order with focus-ring and box | A focus ring drawn somewhere other than the thing it selects is invisible in a screenshot and obvious here. |
| **Rendered text contrast, from pixels** | The important one. Canvas text is invisible to axe, Lighthouse and every DevTools contrast picker, so a canvas page can pass every automated check and still be unreadable. This screenshots the region and measures what the compositor actually produced — depth fog, opacity, blend modes and overlapping layers included. |
| **Frame rate of the page as shipped, under CPU throttling** | A paint-cost microbenchmark answers "how expensive is one frame". It does not answer "what is the child looking at on a school Chromebook". A page with a degradation watchdog can report a healthy 60 fps having already discarded everything worth looking at — so the page's own status readout is printed beside the number. |
| Portrait reflow | CLAUDE.md §4.6: the classroom device is a shared iPad. |

## Honest limits

- **CPU throttling is not a Chromebook.** It is a stand-in. One headless Chromium on one Mac is
  one data point. Before any approach is chosen this needs twenty minutes on a real school
  Chromebook and a real shared iPad, warm and cold, on battery. That is QA work and this script
  does not replace it.
- **The contrast method flatters the page.** Background is the modal colour in the region; ink is
  the pixel furthest from it in luminance. Antialiased glyph edges sit between the two, so a
  reader perceives less contrast than this reports. The bias is deliberate: a failure measured
  this generously is a failure under the kindest available reading.
- **Regions are hand-placed**, in CSS pixels at the declared viewport. Move a layout and the
  rectangles need moving with it. A region that drifts off its text will report the contrast of
  empty background — a suspiciously high ratio with a `bgShare` near 1.0 in `--json` is the tell.
- It measures. It does not judge. Scoring is a human's job and belongs in a Board paper.

## Dependencies

None in this repo, and none should be added. Playwright is borrowed from the evals worktree at
`~/scotling-worktrees/evals`; if it is missing the script says so and exits rather than installing
anything. Adding a browser automation dependency to the public product repo would be the wrong
trade for a tool that only ever runs on a developer's machine.

## Adding a page

Append to `regions.json`: a `name`, a `path` under the preview origin, a `viewport`, optional
`portrait`, the `throttle` rates to try, a `readout` selector if the page reports its own state,
and the text regions to sample. Keep the region labels readable — they end up in a Board paper.
