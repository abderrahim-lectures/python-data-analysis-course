import {defineConfig, devices} from '@playwright/test';

/**
 * Small smoke-test suite guarding the riskiest custom logic (localStorage,
 * UiMode, the placement quiz gate, the playground FAB) — not full coverage.
 * Runs against a production build served locally, matching what GH Pages
 * actually serves (baseUrl included), not the dev server.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // The Trail cells download Pyodide (~10 MB) on first run; cap workers so the
  // shared serve server doesn't stall page `load` under parallel load.
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3050/',
    trace: 'retain-on-failure',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: 'npm run serve -- --port 3050',
    url: 'http://localhost:3050/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
