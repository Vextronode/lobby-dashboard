import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { metaResponseSchema, type ContentResponse, type MetaResponse } from '@lobby/contract';
import { afterEach, describe, expect, it } from 'vitest';
import { createAggregator } from '../src/aggregator';
import { RATE_LIMIT_PER_MINUTE } from '../src/http/rate-limit';
import {
  createHarness,
  silentLogger,
  T0,
  tempDataDir,
  testConfig,
  testEnv,
  type Harness,
} from './harness';

let harness: Harness | undefined;
const cleanups: (() => void)[] = [];

afterEach(async () => {
  await harness?.close();
  harness = undefined;
  for (const cleanup of cleanups.splice(0)) cleanup();
});

async function start(): Promise<Harness> {
  harness = await createHarness();
  return harness;
}

describe('API (LOBBY-02 §E)', () => {
  it('AC-1: 1,000 client requests cause no extra upstream requests', async () => {
    const h = await start();
    await h.aggregator.syncAll();
    const upstreamCalls = h.requests.length;
    for (let i = 0; i < 500; i += 1) {
      await h.get('/api/lobby/content');
      await h.get('/api/lobby/status?device=tv-lobby-1');
    }
    expect(h.requests.length).toBe(upstreamCalls);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'AC-2: %s is rejected with 405 everywhere',
    async (method) => {
      const h = await start();
      for (const path of [
        '/api/lobby/status',
        '/api/lobby/content',
        '/',
        '/api/lobby/meta',
        '/nope',
      ]) {
        const response = await h.get(path, { method });
        expect(response.status, `${method} ${path}`).toBe(405);
        expect(response.headers.get('allow')).toBe('GET, HEAD');
      }
    },
  );

  it('HEAD is allowed', async () => {
    const h = await start();
    expect((await h.get('/api/lobby/content', { method: 'HEAD' })).status).toBe(200);
  });

  it('AC-3: /meta has no "http", env names, or stack traces, and follows the contract', async () => {
    const h = await start();
    await h.setScenario('sigap-down');
    await h.aggregator.syncAll();
    const response = await h.get('/api/lobby/meta');
    const text = await response.text();
    expect(text).not.toMatch(/http/i);
    for (const forbidden of [
      'SIGAP_BASE_URL',
      'TELEGRAM',
      'DATA_DIR',
      'mock.test',
      'Error:',
      '    at ',
    ]) {
      expect(text).not.toContain(forbidden);
    }
    const meta = JSON.parse(text) as MetaResponse;
    expect(metaResponseSchema.safeParse(meta).error).toBeUndefined();
    expect(meta.modules.status).toMatchObject({
      last_error_kind: 'status_502',
      consecutive_failures: 1,
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('FR-E1/E3: a known device is recorded as seen; unknown devices are ignored', async () => {
    const h = await start();
    await h.get('/api/lobby/status?device=tv-lobby-1');
    await h.get('/api/lobby/status?device=intruder');
    const meta = await h.json<MetaResponse>('/api/lobby/meta');
    expect(meta.devices).toEqual({ 'tv-lobby-1': { last_seen: T0.toISOString() } });
  });

  it('FR-E1/E2/E8: cache headers, server_time, and build', async () => {
    const h = await start();
    const status = await h.get('/api/lobby/status');
    expect(status.headers.get('cache-control')).toBe('no-store');
    const content = await h.get('/api/lobby/content');
    expect(content.headers.get('cache-control')).toBe('public, max-age=30');
    expect(content.headers.get('access-control-allow-origin')).toBeNull();
    const body = (await content.json()) as ContentResponse;
    expect(body).toMatchObject({ server_time: T0.toISOString(), build: 'test-build' });
  });

  it('FR-E4: serves thumbnails, 404 for unknown or invalid keys', async () => {
    const h = await start();
    await h.aggregator.syncOne('cimart');
    const content = await h.json<ContentResponse>('/api/lobby/content');
    const imageUrl = content.modules.cimart.data?.featured_products.find(
      (p) => p.image_url !== null,
    )?.image_url;
    expect(imageUrl).toBeDefined();
    const image = await h.get(imageUrl ?? '');
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/webp');
    expect(image.headers.get('cache-control')).toBe('public, max-age=604800, immutable');
    expect((await h.get(`/api/lobby/img/${'0'.repeat(64)}.webp`)).status).toBe(404);
    expect((await h.get('/api/lobby/img/..%2Fsnapshot.json')).status).toBe(404);
  });

  it('FR-E5: /healthz is 200 only while the scheduler runs', async () => {
    const h = await start();
    expect((await h.get('/healthz')).status).toBe(503);
    h.aggregator.start();
    expect(await h.json('/healthz')).toEqual({ ok: true });
    await h.aggregator.stop();
    expect((await h.get('/healthz')).status).toBe(503);
  });

  it(`FR-E7: request ${String(RATE_LIMIT_PER_MINUTE + 1)} in a minute from one client → 429`, async () => {
    const h = await start();
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i += 1) {
      expect((await h.get('/api/lobby/content')).status).toBe(200);
    }
    expect((await h.get('/api/lobby/content')).status).toBe(429);
    expect((await h.get('/healthz')).status).not.toBe(429); // only /api/lobby/* is limited
    h.clock.advance(60_000);
    expect((await h.get('/api/lobby/content')).status).toBe(200);
  });

  it('unknown paths → 404 JSON without details', async () => {
    const h = await start();
    const response = await h.get('/api/lobby/secret');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });

  it('FR-E6: serves the web build for /, /tv, and /assets', async () => {
    const { dir, cleanup } = tempDataDir();
    cleanups.push(cleanup);
    const web = join(dir, 'web');
    mkdirSync(join(web, 'assets'), { recursive: true });
    writeFileSync(join(web, 'index.html'), '<!doctype html><div id="root"></div>');
    writeFileSync(join(web, 'assets', 'app.js'), 'console.log(1)');
    const aggregator = await createAggregator({
      env: testEnv(dir, { WEB_DIST_DIR: web }),
      config: testConfig(),
      fetchImpl: () => Promise.reject(new Error('offline')),
      now: () => T0,
      logger: silentLogger,
    });
    for (const path of ['/', '/tv']) {
      const page = await aggregator.app.request(path);
      expect(page.status, path).toBe(200);
      expect(await page.text()).toContain('id="root"');
    }
    const asset = await aggregator.app.request('/assets/app.js');
    expect(asset.status).toBe(200);
    await aggregator.stop();
  });
});
