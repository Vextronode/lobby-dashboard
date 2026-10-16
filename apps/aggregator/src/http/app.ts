import { Hono } from 'hono';

/** HTTP routes. LOBBY-01 only exposes the liveness probe; the Lobby API arrives in LOBBY-02. */
export function createApp(): Hono {
  const app = new Hono();
  app.get('/healthz', (c) => c.json({ ok: true }));
  return app;
}
