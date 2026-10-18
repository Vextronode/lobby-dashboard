import { existsSync, readdirSync, readFileSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { IMAGE_MAX_BYTES, thumbnailKey, ThumbnailStore } from '../src/images/thumbnails';
import type { FetchLike } from '../src/sources/http-client';
import { silentLogger, T0, tempDataDir } from './harness';

const ORIGIN = 'https://cimart.example.id';
let jpeg: Buffer;

beforeAll(async () => {
  jpeg = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#c84' } })
    .jpeg()
    .toBuffer();
});

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

function setup(
  respond: (url: string) => Response = () =>
    new Response(jpeg, { headers: { 'content-type': 'image/jpeg' } }),
) {
  const { dir, cleanup } = tempDataDir();
  cleanups.push(cleanup);
  const fetchImpl = vi.fn<FetchLike>((url) => Promise.resolve(respond(url)));
  let now = T0;
  const store = new ThumbnailStore({
    dir,
    allowedOrigin: ORIGIN,
    fetchImpl,
    logger: silentLogger,
    now: () => now,
  });
  return { store, fetchImpl, dir, setNow: (date: Date) => (now = date) };
}

describe('ThumbnailStore (FR-D, F09 R-8 to R-10)', () => {
  it('creates a 480 px WebP served under /api/lobby/img', async () => {
    const { store, dir } = setup();
    const url = `${ORIGIN}/storage/products/a.jpg`;
    const path = await store.thumbnailFor(url);
    expect(path).toBe(`/api/lobby/img/${thumbnailKey(url)}.webp`);
    const meta = await sharp(readFileSync(join(dir, `${thumbnailKey(url)}.webp`))).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 480 });
  });

  it('AC-4: an image from another origin is never downloaded', async () => {
    const { store, fetchImpl } = setup();
    expect(await store.thumbnailFor('https://evil.example.com/storage/a.jpg')).toBeNull();
    expect(await store.thumbnailFor('http://cimart.example.id/storage/a.jpg')).toBeNull(); // other scheme
    expect(await store.thumbnailFor('not a url')).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('AC-4: the same image is downloaded only once', async () => {
    const { store, fetchImpl } = setup();
    const url = `${ORIGIN}/storage/products/a.jpg`;
    const first = await store.thumbnailFor(url);
    const second = await store.thumbnailFor(url);
    expect(second).toBe(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'AC-F09-4: not an image',
      () => new Response('<html>', { headers: { 'content-type': 'image/jpeg' } }),
    ],
    ['wrong content type', () => new Response(jpeg, { headers: { 'content-type': 'text/html' } })],
    ['HTTP error', () => new Response('', { status: 404 })],
    [
      'declared larger than 5 MB',
      () =>
        new Response(jpeg, {
          headers: { 'content-type': 'image/jpeg', 'content-length': String(IMAGE_MAX_BYTES + 1) },
        }),
    ],
    [
      'body larger than 5 MB without content-length',
      () =>
        new Response(new Uint8Array(IMAGE_MAX_BYTES + 1), {
          headers: { 'content-type': 'image/jpeg' },
        }),
    ],
  ])('%s → null, nothing stored', async (_label, respond) => {
    const { store, dir } = setup(respond);
    expect(await store.thumbnailFor(`${ORIGIN}/storage/products/x.jpg`)).toBeNull();
    expect(existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.webp')) : []).toEqual([]);
  });

  it('a download that throws → null', async () => {
    const { dir, cleanup } = tempDataDir();
    cleanups.push(cleanup);
    const store = new ThumbnailStore({
      dir,
      allowedOrigin: ORIGIN,
      fetchImpl: () => Promise.reject(new Error('down')),
      logger: silentLogger,
      now: () => T0,
    });
    expect(await store.thumbnailFor(`${ORIGIN}/storage/a.jpg`)).toBeNull();
  });

  it('FR-D4: removes thumbnails not referenced for 7 days', async () => {
    const { store, dir, setNow } = setup();
    const oldUrl = `${ORIGIN}/storage/old.jpg`;
    const keptUrl = `${ORIGIN}/storage/kept.jpg`;
    await store.thumbnailFor(oldUrl);
    await store.thumbnailFor(keptUrl);
    const eightDaysAgo = new Date(T0.getTime() - 8 * 86_400_000);
    utimesSync(join(dir, `${thumbnailKey(oldUrl)}.webp`), eightDaysAgo, eightDaysAgo);
    utimesSync(join(dir, `${thumbnailKey(keptUrl)}.webp`), eightDaysAgo, eightDaysAgo);

    await store.thumbnailFor(keptUrl); // referenced again now
    setNow(T0);
    expect(await store.removeUnused()).toBe(1);
    expect(readdirSync(dir)).toEqual([`${thumbnailKey(keptUrl)}.webp`]);
  });

  it('only resolves valid keys to files', () => {
    const { store } = setup();
    expect(store.fileForKey('../snapshot')).toBeNull();
    expect(store.fileForKey('a'.repeat(64))).not.toBeNull();
  });
});
