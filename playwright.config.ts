// Playwright config for studio/* branch CI only. This never runs against production and
// never deploys anything -- it starts a plain static file server over the repo's own public/
// folder and talks to that. See .github/workflows/studio-pr-checks.yml.
import { defineConfig } from '@playwright/test';

const PORT = process.env.SCOTLING_CI_PORT || '5173';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `python3 -m http.server ${PORT} --directory public`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: false,
    timeout: 10_000,
  },
});
