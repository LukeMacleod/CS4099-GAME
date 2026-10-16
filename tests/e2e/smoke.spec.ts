// Smoke test only: this is CI scaffolding for studio/* branches, not a full regression suite.
// It proves the static build boots without a JS crash. It never touches a deployed environment
// and never writes anywhere -- see .github/workflows/studio-pr-checks.yml, which runs this on
// pull_request and does not deploy.
import { test, expect } from '@playwright/test';

test('index.html loads and the game shell renders without a JS crash', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/index.html');
  await expect(page).toHaveTitle(/Geamaichean Gàidhlig/);

  const container = page.locator('#game-container');
  await expect(container).not.toBeEmpty();

  expect(pageErrors, `uncaught JS error(s): ${pageErrors.map((e) => e.message).join('; ')}`).toEqual([]);
});

test('game.js, game.css and the first audio asset are reachable', async ({ page, baseURL }) => {
  for (const path of ['/game.js', '/game.css', '/music/non-game.ogg']) {
    const res = await page.request.get(`${baseURL}${path}`);
    expect(res.ok(), `${path} returned ${res.status()}`).toBeTruthy();
    const body = await res.body();
    expect(body.length, `${path} was zero bytes`).toBeGreaterThan(0);
  }
});
