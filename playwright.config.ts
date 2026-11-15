import { defineConfig } from '@playwright/test';

// End-to-end tests run against the production build served by `vite preview`,
// using the Chrome already installed on this machine (no browser download).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 300_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    headless: process.env.VORAX_HEADED ? false : true,
    viewport: { width: 1280, height: 720 },
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
