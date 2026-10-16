import { defineConfig, devices } from '@playwright/test';

const WEB_URL = 'http://localhost:5173';
const isCi = process.env.CI !== undefined;

export default defineConfig({
  testDir: 'apps/web/e2e',
  outputDir: 'test-results',
  forbidOnly: isCi,
  reporter: isCi ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: WEB_URL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: WEB_URL,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
