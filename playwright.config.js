// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Scotling evals - classroom-flows Playwright config.
 * Serves public/ with a plain static server (python3 -m http.server) and
 * tests at the two classroom viewports: shared tablet and Chromebook.
 * This file lives only on the studio/evals worktree branch, never on main.
 */
module.exports = defineConfig({
  testDir: './studio-evals-tests',
  outputDir: `${process.env.HOME}/scotling-studio/studio/evals/classroom-flows/test-results`,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: `${process.env.HOME}/scotling-studio/studio/evals/classroom-flows/results.json` }]],
  use: {
    baseURL: 'http://127.0.0.1:8930',
    trace: 'off',
  },
  webServer: {
    command: 'python3 -m http.server 8930 --directory public',
    url: 'http://127.0.0.1:8930/index.html',
    reuseExistingServer: true,
    timeout: 20000,
  },
  projects: [
    {
      name: 'tablet-1024x768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'chromebook-1366x768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
  ],
});
