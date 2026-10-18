import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  contentResponseSchema,
  statusResponseSchema,
  type ContentResponse,
  type StatusResponse,
} from '@lobby/contract';
import { afterEach, describe, expect, it } from 'vitest';
import { createHarness, MOCK_ORIGIN, testConfig, type Harness } from './harness';

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

let harness: Harness | undefined;

afterEach(async () => {
  await harness?.close();
  harness = undefined;
});

async function start(options: Parameters<typeof createHarness>[0] = {}): Promise<Harness> {
  harness = await createHarness(options);
  return harness;
}

describe('modules against the mock upstream', () => {
  it('normal scenario: every module ok and responses follow the contract', async () => {
    const h = await start();
    await h.aggregator.syncAll();

    const content = await h.json<ContentResponse>('/api/lobby/content');
    expect(contentResponseSchema.safeParse(content).error).toBeUndefined();
    for (const [module, envelope] of Object.entries(content.modules)) {
      expect(envelope.state, module).toBe('ok');
    }
    const status = await h.json<StatusResponse>('/api/lobby/status');
    expect(statusResponseSchema.safeParse(status).error).toBeUndefined();
    expect(status.status.display.level).toBe('GREEN');

    expect(content.modules.weather.data?.map((day) => day.day_offset)).toEqual([0, 1, 2]);
    expect(content.modules.quake_list.data?.mode).toBe('recent');
    expect(content.modules.preparedness.data?.evacuation_points).toHaveLength(3);
    expect(content.modules.preparedness.data?.contacts).toHaveLength(4);
    expect(content.static.tips.length).toBeGreaterThanOrEqual(3);
  });

  it('AC-F06-1: the event present in both SIGAP scopes is listed once, tagged Jabar', async () => {
    const h = await start();
    await h.aggregator.syncOne('quake_list');
    const { modules } = await h.json<ContentResponse>('/api/lobby/content');
    const items = modules.quake_list.data?.items ?? [];
    const shared = items.filter((item) => item.location.includes('TASIKMALAYA'));
    expect(shared).toHaveLength(1);
    expect(shared[0]?.tag).toBe('Jabar');
    expect(items.length).toBeLessThanOrEqual(9);
  });

  it('AC-F06-2: quake-latest-pair → at most 2 items in latest-pair mode', async () => {
    const h = await start({ scenario: 'quake-latest-pair' });
    await h.aggregator.syncOne('quake_list');
    const { modules } = await h.json<ContentResponse>('/api/lobby/content');
    expect(modules.quake_list.state).toBe('ok');
    expect(modules.quake_list.data?.mode).toBe('latest-pair');
    expect(modules.quake_list.data?.items.length).toBeLessThanOrEqual(2);
  });

  it('config mode latest-pair never calls the recent endpoint', async () => {
    const config = testConfig((c) => ({
      ...c,
      modules: { ...c.modules, quake_list: { ...c.modules.quake_list, mode: 'latest-pair' } },
    }));
    const h = await start({ config });
    await h.aggregator.syncOne('quake_list');
    expect(h.requests.some((url) => url.includes('/earthquakes/recent'))).toBe(false);
  });

  it('AC-F01-1: sigap-fallback → "Data tidak terkini", never GREEN', async () => {
    const h = await start({ scenario: 'sigap-fallback' });
    await h.aggregator.syncOne('status');
    const { status } = await h.json<StatusResponse>('/api/lobby/status');
    expect(status.display.level).toBe('UNKNOWN');
    expect(JSON.stringify(status.display)).not.toContain('Aman');
  });

  it('AC-F12-2: sid-down → SID modules stale then unavailable by age, others ok', async () => {
    const h = await start();
    await h.aggregator.syncAll();
    await h.setScenario('sid-down');

    // 46 minutes later: SID services (15 min interval) is stale; population (60 min) still ok.
    h.clock.advance(46 * MINUTE_MS);
    await h.aggregator.syncAll();
    let content = await h.json<ContentResponse>('/api/lobby/content');
    expect(content.modules.sid_services.state).toBe('stale');
    expect(content.modules.sid_services.data).not.toBeNull(); // F12 R-8: old data kept
    expect(content.modules.sid_population.state).toBe('ok');
    expect(content.modules.weather.state).toBe('ok');
    expect(content.modules.cimart.state).toBe('ok');

    // Past 24 h: services unavailable (data no longer sent); population (max 7 days) stale.
    h.clock.advance(24 * HOUR_MS);
    await h.aggregator.syncAll();
    content = await h.json<ContentResponse>('/api/lobby/content');
    expect(content.modules.sid_services).toMatchObject({ state: 'unavailable', data: null });
    expect(content.modules.sid_population.state).toBe('stale');
    expect(content.modules.quake_pangandaran.state).toBe('ok');
    expect(h.aggregator.entries().sid_services.last_error_kind).toBe('http_503');
  });

  it('asks SID for the configured village (village_code)', async () => {
    const h = await start();
    await h.aggregator.syncOne('sid_population');
    await h.aggregator.syncOne('sid_services');
    const sidRequests = h.requests.filter((url) => url.includes('/sid/'));
    expect(sidRequests).toHaveLength(2);
    for (const url of sidRequests) {
      expect(new URL(url).searchParams.get('village_code')).toBe('3218032001');
    }
  });

  it('sid-unpublished → population passed through as unpublished', async () => {
    const h = await start({ scenario: 'sid-unpublished' });
    await h.aggregator.syncOne('sid_population');
    const { modules } = await h.json<ContentResponse>('/api/lobby/content');
    expect(modules.sid_population.data).toEqual({
      published: false,
      generated_at: expect.any(String) as unknown,
    });
  });

  it.each([
    ['cimart-phase0', 0, 2],
    ['cimart-phase1', 1, 8],
  ] as const)('AC-F09-3: %s → phase %i with %i products', async (scenario, phase, count) => {
    const h = await start({ scenario });
    await h.aggregator.syncOne('cimart');
    const { modules } = await h.json<ContentResponse>('/api/lobby/content');
    expect(modules.cimart.data?.phase).toBe(phase);
    expect(modules.cimart.data?.featured_products).toHaveLength(count);
  });

  it('AC-F09-3: 12 products from CiMart → phase 1 with 8 products', async () => {
    const fixture = JSON.parse(
      readFileSync(
        fileURLToPath(
          new URL(
            '../../../packages/contract/fixtures/cimart/lobby-summary.phase1.json',
            import.meta.url,
          ),
        ),
        'utf8',
      ),
    ) as { featured_products: Record<string, unknown>[] };
    const twelve = [...fixture.featured_products, ...fixture.featured_products.slice(0, 2)].map(
      (p, i) => ({
        ...p,
        id: 500 + i,
        image_url: null,
      }),
    );
    const h = await start({
      intercept: (url) =>
        url === `${MOCK_ORIGIN}/cimart/api/public/lobby-summary`
          ? Response.json({ ...fixture, featured_products: twelve })
          : undefined,
    });
    await h.aggregator.syncOne('cimart');
    const { modules } = await h.json<ContentResponse>('/api/lobby/content');
    expect(modules.cimart.data?.phase).toBe(1);
    expect(modules.cimart.data?.featured_products).toHaveLength(8);
  });

  it('AC-F09-4: a broken product image → no photo for that product, module still ok', async () => {
    const h = await start();
    await h.aggregator.syncOne('cimart');
    const { modules } = await h.json<ContentResponse>('/api/lobby/content');
    expect(modules.cimart.state).toBe('ok');
    const products = modules.cimart.data?.featured_products ?? [];
    expect(products.find((p) => p.slug === 'ikan-asin-jambal')?.image_url).toBeNull();
    expect(products.find((p) => p.slug === 'keripik-pisang')?.image_url).toMatch(
      /^\/api\/lobby\/img\/[0-9a-f]{64}\.webp$/,
    );
  });

  it('an invalid upstream body counts as a failure and keeps the previous data', async () => {
    let broken = false;
    const h = await start({
      intercept: (url) =>
        broken && url.includes('/weather/forecast')
          ? Response.json({ success: true, data: 'oops' })
          : undefined,
    });
    await h.aggregator.syncOne('weather');
    broken = true;
    await h.aggregator.syncOne('weather');
    const entry = h.aggregator.entries().weather;
    expect(entry).toMatchObject({ consecutive_failures: 1, last_error_kind: 'invalid_schema' });
    expect(entry.data).not.toBeNull();
  });

  it('preparedness fails as a whole when one of its two endpoints fails', async () => {
    const h = await start({
      intercept: (url) =>
        url.includes('/emergency-contacts') ? new Response('', { status: 500 }) : undefined,
    });
    await h.aggregator.syncOne('preparedness');
    expect(h.aggregator.entries().preparedness).toMatchObject({
      data: null,
      last_error_kind: 'http_500',
    });
  });
});
