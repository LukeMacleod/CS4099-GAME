#!/usr/bin/env node
/**
 * Spike audit — reproducible evidence for art-direction decisions.
 *
 * Written by role 23 (red team critic) for the hub-A / hub-B duel of 16 Oct 2026. It exists
 * because a spike README is a claim and the Board should be deciding on measurements. Every
 * number in `studio/governance/board/duel-hub-spike-judge-red-team-critic.md` comes from here.
 *
 * It measures, per page:
 *   1. HTTP status, request count, and every request that leaves the origin (CLAUDE.md 4.3:
 *      no third-party trackers, analytics, ads or runtime CDN fonts).
 *   2. Cookies and localStorage/sessionStorage writes (ICO Children's Code, high-privacy default).
 *   3. Console errors and uncaught page errors.
 *   4. `<html lang>`, the first heading, and a skip link — the three things a screen reader in a
 *      GME classroom depends on first.
 *   5. The tab order: what each stop is, its focus-ring width/colour, and its box. A focus ring
 *      that is not on the thing it selects is a defect you cannot see in a screenshot.
 *   6. RENDERED text contrast, sampled from pixels, not from CSS. Canvas text is invisible to
 *      every automated checker, so a canvas page can pass axe and still be unreadable. Regions
 *      are declared per page in `regions.json`.
 *   7. Frame rate under CPU throttling (1x / 6x / 10x) against the page AS SHIPPED, including
 *      whatever degradation watchdog it carries. This is the Chromebook question. A paint-cost
 *      microbenchmark is not an answer to it: what matters is what the child ends up looking at.
 *
 * Deliberately NOT claimed: CPU throttling is a stand-in for a weak device, not a weak device,
 * and one headless browser on one Mac is one data point. Before any approach is chosen this
 * needs 20 minutes on a real school Chromebook and a real shared iPad, warm and cold, on
 * battery. That is a QA task and this script does not replace it.
 *
 * Usage:
 *   python3 -m http.server 8787 --bind 127.0.0.1 --directory public   # in another shell
 *   node tools/spike-audit/audit.mjs                                  # all pages in regions.json
 *   node tools/spike-audit/audit.mjs hub-A                            # one page
 *   node tools/spike-audit/audit.mjs --json > /tmp/audit.json
 *
 * Playwright is not a dependency of this repo and must not become one. The script finds it in
 * the evals worktree (~/scotling-worktrees/evals) or anywhere NODE_PATH points, and exits with
 * a clear message rather than installing anything.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ORIGIN = process.env.SPIKE_ORIGIN || 'http://127.0.0.1:8787';
const WCAG_TEXT = 4.5;   // SC 1.4.3, normal text, AA
const WCAG_UI = 3.0;     // SC 1.4.11, non-text contrast, AA

/* ---------- Playwright, borrowed not depended on ---------------------------------------- */

function loadPlaywright() {
  const candidates = [
    join(homedir(), 'scotling-worktrees', 'evals', 'package.json'),
    join(HERE, 'package.json'),
  ];
  for (const anchor of candidates) {
    try { return createRequire(anchor)('playwright'); } catch { /* try the next one */ }
  }
  console.error(
    'playwright not found.\n' +
    'This repo must not take it as a dependency. Install it in the evals worktree:\n' +
    '  cd ~/scotling-worktrees/evals && npm i -D playwright && npx playwright install chromium'
  );
  process.exit(3);
}

/* ---------- contrast ---------------------------------------------------------------------- */

const channel = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)];
  return +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05))).toFixed(2);
}

/**
 * Contrast of a rendered text run, from a screenshot of the region.
 *
 * Background = the modal colour in the region. Ink = the pixel whose luminance is furthest from
 * it. Taking the extreme pixel FLATTERS the page: antialiased glyph edges sit between ink and
 * background, so a reader perceives less contrast than this reports. That bias is deliberate —
 * a failure measured this way is a failure under the most generous reading available, which is
 * the only kind of contrast finding worth putting in front of a Board.
 */
function contrastOfRegion(rgba, pixelCount) {
  const counts = new Map();
  const pixels = [];
  for (let i = 0; i < rgba.length; i += 4) {
    const px = [rgba[i], rgba[i + 1], rgba[i + 2]];
    const key = px.join(',');
    counts.set(key, (counts.get(key) || 0) + 1);
    pixels.push(px);
  }
  let bgKey = null, bgCount = 0;
  for (const [k, n] of counts) if (n > bgCount) { bgCount = n; bgKey = k; }
  const bg = bgKey.split(',').map(Number);
  const bgLum = luminance(bg);
  let ink = bg, spread = 0;
  for (const px of pixels) {
    const d = Math.abs(luminance(px) - bgLum);
    if (d > spread) { spread = d; ink = px; }
  }
  return { ink, bg, bgShare: +(bgCount / pixelCount).toFixed(2), ratio: contrast(ink, bg) };
}

/* ---------- the passes -------------------------------------------------------------------- */

async function hygiene(page, url) {
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  const response = await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const offOrigin = requests.filter((u) => !u.startsWith(ORIGIN + '/') && !u.startsWith('data:'));
  const dom = await page.evaluate(() => {
    const read = (fn) => { try { return fn(); } catch { return 'blocked'; } };
    const heading = document.querySelector('h1,h2,h3');
    const skip = [...document.querySelectorAll('a[href^="#"]')]
      .find((a) => /skip/i.test(a.textContent || ''));
    return {
      title: document.title,
      lang: document.documentElement.lang || '(none)',
      firstHeading: heading ? `${heading.tagName}: ${heading.textContent.trim().slice(0, 70)}` : null,
      hasH1: !!document.querySelector('h1'),
      skipLink: skip ? skip.textContent.trim() : null,
      localStorage: read(() => localStorage.length),
      sessionStorage: read(() => sessionStorage.length),
      cookies: document.cookie.length,
      gaelicInDom: (document.body.innerText.match(/[àèìòùÀÈÌÒÙ]/g) || []).length,
    };
  });

  return { status: response.status(), requests: requests.length, offOrigin, consoleErrors, pageErrors, ...dom };
}

async function tabOrder(page, stops) {
  const seen = [];
  for (let i = 0; i < stops; i++) {
    await page.keyboard.press('Tab');
    seen.push(await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: 'BODY', note: 'focus landed on <body> — a stray stop' };
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const cls = typeof el.className === 'string' ? el.className : (el.className?.baseVal ?? '');
      return {
        tag: el.tagName + (cls ? '.' + cls.trim().split(/\s+/)[0] : ''),
        label: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 48),
        outline: `${cs.outlineWidth} ${cs.outlineColor}`,
        box: `${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.x)},${Math.round(r.y)}`,
      };
    }));
  }
  return seen;
}

async function textContrast(page, regions) {
  const out = [];
  for (const { label, rect, kind } of regions) {
    // Screenshot the region through the compositor rather than reading the DOM. This is the
    // whole point: a canvas-drawn title and a CSS-styled one are measured the same way, and
    // depth fog, opacity, blend modes and overlapping layers are all included, because the
    // child sees the composited result and not the stylesheet.
    const shot = await page.screenshot({ clip: { x: rect[0], y: rect[1], width: rect[2], height: rect[3] } });
    const px = await decodePng(page, shot);
    const m = contrastOfRegion(px.data, rect[2] * rect[3]);
    const floor = kind === 'ui' ? WCAG_UI : WCAG_TEXT;
    out.push({ label, kind: kind || 'text', ...m, floor, pass: m.ratio >= floor });
  }
  return out;
}

/** Decode a PNG buffer by handing it back to the browser, which already has a PNG decoder. */
async function decodePng(page, buffer) {
  const b64 = buffer.toString('base64');
  const data = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    return Array.from(g.getImageData(0, 0, img.width, img.height).data);
  }, b64);
  return { data };
}

/**
 * Frame rate of the page as shipped, under CPU throttling.
 *
 * Reports the page's own status readout alongside the number, because a page with a degradation
 * watchdog can report a healthy 60 fps while having already thrown away everything that made it
 * worth looking at. The readout is what tells you which happened.
 */
async function framerate(context, page, url, rate, readoutSelector) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const fps = await page.evaluate(() => new Promise((resolve) => {
    let frames = 0, worst = Infinity, last = performance.now();
    const start = last;
    const tick = (t) => {
      const delta = t - last; last = t; frames++;
      if (frames > 5 && delta > 0) worst = Math.min(worst, 1000 / delta);
      if (t - start < 4000) requestAnimationFrame(tick);
      else resolve({ mean: +(frames / ((t - start) / 1000)).toFixed(1), min: +worst.toFixed(1) });
    };
    requestAnimationFrame(tick);
  }));
  const readout = readoutSelector
    ? await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.innerText.replace(/\s+/g, ' ').trim() : null;
      }, readoutSelector)
    : null;
  return { rate, ...fps, readout };
}

/* ---------- runner ------------------------------------------------------------------------ */

async function auditPage(browser, spec) {
  const url = ORIGIN + spec.path;
  const report = { name: spec.name, url };
  const viewport = spec.viewport || { width: 1366, height: 768 };

  let ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  let page = await ctx.newPage();
  report.hygiene = await hygiene(page, url);
  report.contrast = await textContrast(page, spec.regions || []);
  report.tabOrder = await tabOrder(page, spec.tabStops ?? 14);
  await ctx.close();

  report.framerate = [];
  for (const rate of spec.throttle || [1, 6, 10]) {
    ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    page = await ctx.newPage();
    report.framerate.push(await framerate(ctx, page, url, rate, spec.readout));
    await ctx.close();
  }

  if (spec.portrait) {
    ctx = await browser.newContext({ viewport: spec.portrait, deviceScaleFactor: 1 });
    page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    report.portrait = await page.evaluate(() => ({
      horizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    await ctx.close();
  }

  return report;
}

function print(report) {
  const h = report.hygiene;
  console.log(`\n${'='.repeat(78)}\n${report.name}  ${report.url}\n${'='.repeat(78)}`);
  console.log(`HTTP ${h.status} · ${h.requests} requests · off-origin: ${h.offOrigin.length ? h.offOrigin.join(', ') : 'none'}`);
  console.log(`storage: ls=${h.localStorage} ss=${h.sessionStorage} cookies=${h.cookies}`);
  console.log(`lang="${h.lang}" · h1=${h.hasH1 ? 'yes' : 'NO'} · first heading: ${h.firstHeading || 'none'} · skip link: ${h.skipLink || 'none'}`);
  if (h.consoleErrors.length) console.log(`console errors: ${h.consoleErrors.join(' | ')}`);
  if (h.pageErrors.length) console.log(`PAGE ERRORS: ${h.pageErrors.join(' | ')}`);

  if (report.contrast.length) {
    console.log('\n-- rendered text contrast (sampled from pixels; generous method, see header) --');
    for (const c of report.contrast) {
      console.log(`  ${c.pass ? 'pass' : 'FAIL'}  ${String(c.ratio).padStart(6)}:1  (floor ${c.floor})  ${c.label}`);
    }
  }

  console.log('\n-- frame rate as shipped, under CPU throttling --');
  for (const f of report.framerate) {
    console.log(`  ${String(f.rate).padStart(2)}x  mean ${String(f.mean).padStart(5)} fps  min ${String(f.min).padStart(5)} fps` +
      (f.readout ? `  page says: "${f.readout}"` : ''));
  }

  if (report.portrait) {
    console.log(`\n-- portrait ${report.portrait.clientWidth}px: horizontal scroll ${report.portrait.horizontalScroll ? 'YES (defect)' : 'no'} --`);
  }

  console.log('\n-- tab order --');
  report.tabOrder.forEach((s, i) => {
    console.log(`  ${String(i).padStart(2)}. ${(s.tag || '').padEnd(22)} ${s.note || `"${s.label}"`}`);
    if (!s.note) console.log(`      ring ${s.outline} · ${s.box}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const wanted = args.filter((a) => !a.startsWith('--'));
  const specs = JSON.parse(readFileSync(join(HERE, 'regions.json'), 'utf8'))
    .filter((s) => !wanted.length || wanted.includes(s.name));

  if (!specs.length) { console.error('no matching page in regions.json'); process.exit(2); }

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const reports = [];
  try {
    for (const spec of specs) reports.push(await auditPage(browser, spec));
  } finally {
    await browser.close();
  }

  if (asJson) console.log(JSON.stringify(reports, null, 2));
  else reports.forEach(print);
}

main().catch((e) => { console.error(e); process.exit(1); });
