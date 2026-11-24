import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// NixOS support for Chromium headless shell
if (
  process.platform === 'linux' &&
  process.env.NIX_LD_LIBRARY_PATH &&
  !process.env.NIX_LD_LIBRARY_PATH.includes('libgbm')
) {
  try {
    const mesaDirs = fs
      .readdirSync('/nix/store')
      .filter((f) => f.includes('mesa-libgbm') && !f.endsWith('.drv'));
    for (const dir of mesaDirs) {
      const libPath = `/nix/store/${dir}/lib/libgbm.so.1`;
      if (fs.existsSync(libPath)) {
        const header = fs.readFileSync(libPath);
        if (header[4] === 2) {
          // 64-bit ELF
          process.env.NIX_LD_LIBRARY_PATH = `${process.env.NIX_LD_LIBRARY_PATH}:/nix/store/${dir}/lib`;
          break;
        }
      }
    }
  } catch {
    // Ignore if /nix/store is not accessible
  }
}

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
