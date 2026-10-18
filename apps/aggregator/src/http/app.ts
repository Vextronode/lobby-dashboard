import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import type { ContentResponse, MetaResponse, StatusResponse } from '@lobby/contract';
import { Hono, type Context } from 'hono';
import type { Logger } from '../observability/logger';
import { rateLimit } from './rate-limit';

const READ_METHODS = new Set(['GET', 'HEAD']);
const DEVICE_ID_MAX_LENGTH = 64;
const CACHE_NO_STORE = 'no-store';
const CACHE_CONTENT = 'public, max-age=30';
const CACHE_THUMBNAIL = 'public, max-age=604800, immutable';

export interface HttpDeps {
  readonly now: () => Date;
  readonly logger: Logger;
  readonly status: (now: Date, deviceId: string | undefined) => StatusResponse;
  readonly content: (now: Date) => ContentResponse;
  readonly meta: (now: Date) => MetaResponse;
  readonly isHealthy: () => boolean;
  /** Absolute thumbnail file for a key, or `null` when the key is not valid. */
  readonly thumbnailFile: (key: string) => string | null;
  /** Client identity for rate limiting. */
  readonly clientKey: (c: Context) => string;
  /** Built `apps/web`; undefined = API only. */
  readonly webDistDir: string | undefined;
}

/**
 * HTTP layer (LOBBY-02 §E). Handlers stay thin: read the cache through the presenters and return.
 * Only GET/HEAD exist anywhere (guidelines §2.1); no CORS headers (same origin, default B22).
 */
export function createApp(deps: HttpDeps): Hono {
  const app = new Hono();

  app.onError((error, c) => {
    deps.logger.error({ err: error, path: c.req.path }, 'request failed');
    // Generic body: no stack, query, file path, or env name (guidelines §2.8).
    return c.json({ error: 'internal_error' }, 500);
  });
  app.notFound((c) => c.json({ error: 'not_found' }, 404));

  app.use('*', async (c, next) => {
    if (!READ_METHODS.has(c.req.method)) {
      return c.json({ error: 'method_not_allowed' }, 405, { Allow: 'GET, HEAD' });
    }
    await next();
  });
  app.use('/api/lobby/*', rateLimit({ clientKey: deps.clientKey, now: deps.now }));

  app.get('/healthz', (c) =>
    deps.isHealthy() ? c.json({ ok: true }) : c.json({ ok: false }, 503),
  );

  app.get('/api/lobby/status', (c) => {
    const device = c.req.query('device');
    const deviceId =
      device !== undefined && device.length <= DEVICE_ID_MAX_LENGTH ? device : undefined;
    c.header('Cache-Control', CACHE_NO_STORE);
    return c.json(deps.status(deps.now(), deviceId));
  });

  app.get('/api/lobby/content', (c) => {
    c.header('Cache-Control', CACHE_CONTENT);
    return c.json(deps.content(deps.now()));
  });

  app.get('/api/lobby/meta', (c) => {
    c.header('Cache-Control', CACHE_NO_STORE);
    return c.json(deps.meta(deps.now()));
  });

  app.get('/api/lobby/img/:file', async (c) => {
    const match = /^(?<key>[0-9a-f]{64})\.webp$/.exec(c.req.param('file'));
    const file = match?.groups?.key === undefined ? null : deps.thumbnailFile(match.groups.key);
    if (file === null) return c.json({ error: 'not_found' }, 404);
    const bytes = await readFile(file).catch(() => null);
    if (bytes === null) return c.json({ error: 'not_found' }, 404);
    return c.body(bytes, 200, { 'Content-Type': 'image/webp', 'Cache-Control': CACHE_THUMBNAIL });
  });

  if (deps.webDistDir !== undefined) mountWebClient(app, deps.webDistDir);
  return app;
}

/** FR-E6: built assets plus the SPA entry for `/` (mobile) and `/tv`. */
function mountWebClient(app: Hono, webDistDir: string): void {
  app.use('/assets/*', serveStatic({ root: webDistDir }));
  const serveIndex = async () => {
    const html = await readFile(join(webDistDir, 'index.html'), 'utf8');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  };
  app.get('/', serveIndex);
  app.get('/tv', serveIndex);
}
