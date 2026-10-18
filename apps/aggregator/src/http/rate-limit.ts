import type { Context, MiddlewareHandler } from 'hono';

/** FR-E7: requests per minute per IP on `/api/lobby/*`. */
export const RATE_LIMIT_PER_MINUTE = 120;
const WINDOW_MS = 60_000;
/** Forget old windows once the table grows, so many distinct IPs cannot grow memory without bound. */
const MAX_TRACKED_CLIENTS = 10_000;

interface Window {
  start: number;
  count: number;
}

/** Fixed-window limiter in memory; one process serves everything (K-A1). */
export function rateLimit(options: {
  readonly clientKey: (c: Context) => string;
  readonly now: () => Date;
  readonly limit?: number;
}): MiddlewareHandler {
  const limit = options.limit ?? RATE_LIMIT_PER_MINUTE;
  const windows = new Map<string, Window>();

  return async (c, next) => {
    const now = options.now().getTime();
    if (windows.size > MAX_TRACKED_CLIENTS) {
      for (const [key, window] of windows) if (now - window.start >= WINDOW_MS) windows.delete(key);
    }
    const key = options.clientKey(c);
    const current = windows.get(key);
    const window =
      current === undefined || now - current.start >= WINDOW_MS
        ? { start: now, count: 0 }
        : current;
    window.count += 1;
    windows.set(key, window);
    if (window.count > limit) {
      const retryAfterS = Math.ceil((window.start + WINDOW_MS - now) / 1_000);
      return c.json({ error: 'too_many_requests' }, 429, { 'Retry-After': String(retryAfterS) });
    }
    await next();
  };
}
