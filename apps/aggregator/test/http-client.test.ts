import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  createUpstreamClient,
  UPSTREAM_TIMEOUT_MS,
  type FetchLike,
} from '../src/sources/http-client';

const schema = z.object({ value: z.number() });

afterEach(() => {
  vi.useRealTimers();
});

describe('createUpstreamClient', () => {
  it('keeps the base path when joining URLs', async () => {
    const fetchImpl = vi.fn<FetchLike>(() => Promise.resolve(Response.json({ value: 1 })));
    const client = createUpstreamClient('https://host.example/sigap/', fetchImpl);
    expect(await client.getJson('/api/public/x?a=1', schema)).toEqual({
      ok: true,
      value: { value: 1 },
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://host.example/sigap/api/public/x?a=1');
  });

  it.each([
    ['HTTP 502', () => Promise.resolve(new Response('', { status: 502 })), 'http_502'],
    ['body not JSON', () => Promise.resolve(new Response('<html>')), 'invalid_schema'],
    ['schema mismatch', () => Promise.resolve(Response.json({ value: 'x' })), 'invalid_schema'],
    ['network error', () => Promise.reject(new TypeError('fetch failed')), 'network'],
  ] as const)('%s → %s', async (_label, respond, kind) => {
    const client = createUpstreamClient('https://host.example', respond);
    expect(await client.getJson('/x', schema)).toEqual({ ok: false, error: { kind } });
  });

  it('times out after 8 s even if fetch ignores the abort signal', async () => {
    vi.useFakeTimers();
    const client = createUpstreamClient(
      'https://host.example',
      () => new Promise<Response>(() => undefined),
    );
    const pending = client.getJson('/x', schema);
    await vi.advanceTimersByTimeAsync(UPSTREAM_TIMEOUT_MS);
    expect(await pending).toEqual({ ok: false, error: { kind: 'timeout' } });
    expect(vi.getTimerCount()).toBe(0);
  });
});
