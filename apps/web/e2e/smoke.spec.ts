import { expect, test } from '@playwright/test';

const AGGREGATOR_HEALTHZ = 'http://localhost:8080/healthz';

test.describe('pnpm dev smoke (LOBBY-01 AC-2)', () => {
  test('/tv shows the TV placeholder', async ({ page }) => {
    await page.goto('/tv');
    await expect(page.getByRole('heading', { name: 'Layar TV Lobby Desa Cibenda' })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('tv.png') });
  });

  test('/ shows the mobile placeholder', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Lobby Desa Cibenda' })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('mobile.png') });
  });

  test('aggregator /healthz returns 200', async ({ request }) => {
    await expect
      .poll(async () => (await request.get(AGGREGATOR_HEALTHZ).catch(() => null))?.status())
      .toBe(200);
    expect(await (await request.get(AGGREGATOR_HEALTHZ)).json()).toEqual({ ok: true });
  });
});
