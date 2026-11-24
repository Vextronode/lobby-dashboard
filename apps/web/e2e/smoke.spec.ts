import { expect, test } from '@playwright/test';

const AGGREGATOR_HEALTHZ = 'http://localhost:8080/healthz';

test.describe('Lobby Dashboard TV Kiosk (LOBBY-03)', () => {
  test('/tv shows the TV dashboard and cards', async ({ page }) => {
    await page.goto('/tv');
    await expect(page.getByRole('heading', { name: /Desa Cibenda/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel('Informasi Berjalan')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('tv-dashboard.png') });
  });

  test('/tv shows fullscreen on 1920x1080 desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/tv');
    await expect(page.getByRole('heading', { name: /Desa Cibenda/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: test.info().outputPath('tv-fullscreen-1080p.png'),
    });

    // Capture each slide for inspection
    const tabs = [
      'Layanan Surat Desa',
      'Profil Warga Desa',
      'Prakiraan Cuaca',
      'Etalase CiMart',
      'Gempa Terkini BMKG',
    ];
    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];
      if (tabName) {
        await page.getByRole('button', { name: new RegExp(tabName, 'i') }).click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: test.info().outputPath(`tv-slide-${(i + 1).toString()}.png`),
        });
      }
    }
  });

  test('/ shows the mobile page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Lobby Desa Cibenda' })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('mobile.png') });
  });

  test('aggregator /healthz returns 200', async ({ request }) => {
    await expect
      .poll(async () => (await request.get(AGGREGATOR_HEALTHZ).catch(() => null))?.status(), {
        timeout: 30_000,
      })
      .toBe(200);
    expect(await (await request.get(AGGREGATOR_HEALTHZ)).json()).toEqual({ ok: true });
  });
});
