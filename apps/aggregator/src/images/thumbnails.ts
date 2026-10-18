import { createHash } from 'node:crypto';
import { mkdir, readdir, rename, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import type { Logger } from '../observability/logger';
import type { ThumbnailProvider } from '../sources/cimart/summary';
import type { FetchLike } from '../sources/http-client';

/** FR-D1 limits. */
export const THUMBNAIL_WIDTH_PX = 480;
export const THUMBNAIL_QUALITY = 75;
export const IMAGE_DOWNLOAD_TIMEOUT_MS = 10_000;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** FR-D4: thumbnails not referenced for this long are deleted. */
export const UNUSED_THUMBNAIL_MS = 7 * 86_400_000;

const KEY_PATTERN = /^[0-9a-f]{64}$/;
const THUMBNAIL_EXTENSION = '.webp';

/** Thumbnail key: SHA-256 of the source URL, so the same URL is never downloaded twice (FR-D2). */
export function thumbnailKey(imageUrl: string): string {
  return createHash('sha256').update(imageUrl).digest('hex');
}

export function thumbnailPath(key: string): string {
  return `/api/lobby/img/${key}${THUMBNAIL_EXTENSION}`;
}

export interface ThumbnailStoreOptions {
  /** `DATA_DIR/img`. */
  readonly dir: string;
  /** Only images from this origin (the CiMart base URL) are downloaded, preventing SSRF. */
  readonly allowedOrigin: string;
  readonly fetchImpl: FetchLike;
  readonly logger: Logger;
  readonly now: () => Date;
}

/** Downloads CiMart images once, shrinks them to 480 px WebP, and serves them from disk. */
export class ThumbnailStore implements ThumbnailProvider {
  constructor(private readonly options: ThumbnailStoreOptions) {}

  async thumbnailFor(imageUrl: string): Promise<string | null> {
    if (!this.isAllowed(imageUrl)) {
      this.options.logger.warn({ module: 'cimart', error_kind: 'image_origin' }, 'image skipped');
      return null;
    }
    const key = thumbnailKey(imageUrl);
    const file = this.fileFor(key);
    if (await this.touch(file)) return thumbnailPath(key);

    const bytes = await this.download(imageUrl);
    if (bytes === null) return null;
    try {
      const webp = await sharp(bytes)
        .resize({ width: THUMBNAIL_WIDTH_PX, withoutEnlargement: true })
        .webp({ quality: THUMBNAIL_QUALITY })
        .toBuffer();
      await mkdir(this.options.dir, { recursive: true });
      const temporary = `${file}.tmp`;
      await writeFile(temporary, webp);
      await rename(temporary, file);
      // Reference time comes from the injected clock, like every later touch (FR-D4).
      await this.touch(file);
      return thumbnailPath(key);
    } catch {
      this.options.logger.warn({ module: 'cimart', error_kind: 'image_invalid' }, 'image skipped');
      return null;
    }
  }

  /** Absolute file for a valid key, or `null` for anything else (no path traversal). */
  fileForKey(key: string): string | null {
    return KEY_PATTERN.test(key) ? this.fileFor(key) : null;
  }

  /** FR-D4: deletes thumbnails whose last reference is older than 7 days. */
  async removeUnused(): Promise<number> {
    const cutoff = this.options.now().getTime() - UNUSED_THUMBNAIL_MS;
    const names = await readdir(this.options.dir).catch(() => [] as string[]);
    let removed = 0;
    for (const name of names) {
      if (!name.endsWith(THUMBNAIL_EXTENSION)) continue;
      const file = join(this.options.dir, name);
      const info = await stat(file).catch(() => null);
      if (info !== null && info.mtimeMs < cutoff) {
        await rm(file, { force: true });
        removed += 1;
      }
    }
    return removed;
  }

  private fileFor(key: string): string {
    return join(this.options.dir, `${key}${THUMBNAIL_EXTENSION}`);
  }

  private isAllowed(imageUrl: string): boolean {
    try {
      return new URL(imageUrl).origin === this.options.allowedOrigin;
    } catch {
      return false;
    }
  }

  /** Marks an existing thumbnail as referenced now; false when it does not exist. */
  private async touch(file: string): Promise<boolean> {
    const now = this.options.now();
    return utimes(file, now, now).then(
      () => true,
      () => false,
    );
  }

  private async download(imageUrl: string): Promise<Buffer | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, IMAGE_DOWNLOAD_TIMEOUT_MS);
    try {
      // Redirects could leave the allowed origin, so they are refused.
      const response = await this.options.fetchImpl(imageUrl, {
        signal: controller.signal,
        redirect: 'error',
      });
      const contentType = response.headers.get('content-type') ?? '';
      const declaredLength = Number(response.headers.get('content-length') ?? 0);
      if (!response.ok || !contentType.startsWith('image/') || declaredLength > IMAGE_MAX_BYTES) {
        await response.body?.cancel();
        this.options.logger.warn(
          { module: 'cimart', error_kind: 'image_rejected' },
          'image skipped',
        );
        return null;
      }
      return await readLimited(response, IMAGE_MAX_BYTES);
    } catch {
      this.options.logger.warn({ module: 'cimart', error_kind: 'image_download' }, 'image skipped');
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Reads a body but gives up past `maxBytes`, even when `content-length` was missing or wrong. */
async function readLimited(response: Response, maxBytes: number): Promise<Buffer | null> {
  if (response.body === null) return null;
  // Typed explicitly: without the DOM lib, `Response.body` chunks are untyped.
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
