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
