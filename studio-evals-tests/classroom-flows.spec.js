// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Screenshots go to the governance repo's evals folder, named by Playwright
// project (viewport), not committed to the product repo.
const SCREENSHOT_DIR = `${process.env.HOME}/scotling-studio/studio/evals/classroom-flows/screenshots`;
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Allowlist mirrors child-safety/run.py's THIRD_PARTY_ALLOWLIST: hosts the
// Firebase SDK already uses in this prototype, plus the local test server.
const ALLOWED_HOST_SUFFIXES = [
  'gstatic.com', 'googleapis.com', 'google.com', 'firebaseio.com',
  'firebase.google.com', 'firebaseapp.com', 'firebasestorage.app',
  '127.0.0.1', 'localhost',
];

function hostAllowed(host) {
  return ALLOWED_HOST_SUFFIXES.some((a) => host === a || host.endsWith(`.${a}`));
}

test.describe('classroom flows', () => {
  test('(a) index loads', async ({ page }) => {
    const response = await page.goto('/index.html');
    expect(response?.status()).toBe(200);
    await expect(page.locator('#game-container')).toBeAttached();
  });

  test('(b) entering class code P-7 reaches the game', async ({ page }) => {
    await page.goto('/index.html');
    const input = page.locator('#participant-code');
    await expect(input).toBeVisible();
    await input.fill('P-7');
    await page.getByRole('button', { name: 'Tòisich' }).click();
    // Login submit -> RUAIRIDH_INTRO flow state; the intro screen's start button
    // is the observable signal that login succeeded and the game proper began.
    await expect(page.locator('.ruairidh-intro-screen')).toBeVisible({ timeout: 10000 });
  });

  test("(c) a grave-accented Gaelic string is present and rendered", async ({ page }, testInfo) => {
    await page.goto('/index.html');
    await page.locator('#participant-code').fill('P-7');
    await page.getByRole('button', { name: 'Tòisich' }).click();

    const bubble = page.locator('.speech-bubble p');
    await expect(bubble).toBeVisible({ timeout: 10000 });
    // .speech-bubble p fades in via a 0.75s CSS animation (opacity 0 -> 1,
    // 0.15s delay) - wait for it to finish so the screenshot shows rendered
    // text rather than a mid-fade frame.
    await expect(async () => {
      const opacity = await bubble.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
      expect(opacity).toBeGreaterThan(0.95);
    }).toPass({ timeout: 3000 });
    const text = await bubble.textContent();

    // "Ròn" (seal) carries a grave accent on ò - retrieved verbatim from the
    // shipped narration, not generated here.
    expect(text).toContain('Ròn');
    const graveAccentPattern = /[àèìòù]/;
    expect(text).toMatch(graveAccentPattern);

    // Computed-style check: the bubble must not have fallen back to a
    // generic system font that could be missing diacritic glyphs (best we
    // can detect without a glyph-rasterisation diff).
    const fontFamily = await bubble.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily.length).toBeGreaterThan(0);
    expect(fontFamily.toLowerCase()).not.toBe('serif');
    expect(fontFamily.toLowerCase()).not.toBe('sans-serif');

    const screenshotPath = path.join(SCREENSHOT_DIR, `diacritic-${testInfo.project.name}.png`);
    await page.screenshot({ path: screenshotPath });
    testInfo.attachments.push({ name: 'diacritic-screenshot', path: screenshotPath, contentType: 'image/png' });
  });

  test('(d) no network request leaves to a non-Firebase third-party host', async ({ page }, testInfo) => {
    /** @type {Set<string>} */
    const observedHosts = new Set();
    /** @type {string[]} */
    const disallowed = [];

    page.on('request', (req) => {
      try {
        const host = new URL(req.url()).hostname;
        observedHosts.add(host);
        if (!hostAllowed(host)) disallowed.push(`${host} <- ${req.url()}`);
      } catch (_e) { /* ignore unparsable URLs (data:, blob:) */ }
    });

    await page.goto('/index.html');
    await page.locator('#participant-code').fill('P-7');
    await page.getByRole('button', { name: 'Tòisich' }).click();
    await page.locator('.ruairidh-intro-screen').waitFor({ timeout: 10000 }).catch(() => {});
    // give async Firebase init calls a moment to fire
    await page.waitForTimeout(2000);

    const outPath = path.join(
      `${process.env.HOME}/scotling-studio/studio/evals/classroom-flows`,
      `observed-hosts-${testInfo.project.name}.json`,
    );
    fs.writeFileSync(outPath, JSON.stringify({ observedHosts: [...observedHosts].sort(), disallowed }, null, 2));

    expect(disallowed, `disallowed third-party hosts: ${disallowed.join(', ')}`).toEqual([]);
  });
});
