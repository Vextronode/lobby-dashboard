import { Hono } from 'hono';
import {
  DEFAULT_RED_PHASE_MS,
  isScenario,
  resolveResponse,
  type Endpoint,
  type Scenario,
} from './scenarios';

/** Upstream paths, prefixed per system so one mock port can stand in for all three base URLs. */
const ROUTES: readonly (readonly [path: string, endpoint: Endpoint])[] = [
  ['/sigap/api/public/alerts/current', 'alerts-current'],
  ['/sigap/api/public/earthquakes/pangandaran', 'quake-pangandaran'],
  ['/sigap/api/public/earthquakes/west-java', 'quake-west-java'],
  ['/sigap/api/public/earthquakes/indonesia', 'quake-indonesia'],
  ['/sigap/api/public/earthquakes/recent', 'quake-recent'],
  ['/sigap/api/public/weather/forecast', 'weather-forecast'],
  ['/sigap/api/public/evacuation-points', 'evacuation-points'],
  ['/sigap/api/public/emergency-contacts', 'emergency-contacts'],
  ['/sid/api/public/lobby/population', 'sid-population'],
  ['/sid/api/public/lobby/services', 'sid-services'],
  ['/cimart/api/public/lobby-summary', 'cimart-summary'],
];

export interface MockOptions {
  readonly scenario: Scenario;
  readonly redPhaseMs?: number;
  readonly now?: () => Date;
  readonly sleep?: (ms: number) => Promise<void>;
}

/** Image host used in the CiMart fixtures; rewritten to the mock so thumbnails work in dev and tests. */
const FIXTURE_CIMART_STORAGE = 'https://cimart.example.id/storage/';

/** 1×1 PNG served for every product image. */
const PRODUCT_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/** This product's image is deliberately not an image, to exercise the thumbnail fallback (F09 R-9). */
export const BROKEN_IMAGE_FILE = 'ikan-asin-jambal.jpg';

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Mock SIGAP/SID/CiMart server. `GET /__scenario/<name>` switches the scenario; this control
 * route exists only here, never in the aggregator (LOBBY-01 rules).
 */
export function createMockApp(options: MockOptions): Hono {
  const now = options.now ?? (() => new Date());
  const sleep = options.sleep ?? defaultSleep;
  const redPhaseMs = options.redPhaseMs ?? DEFAULT_RED_PHASE_MS;
  let scenario = options.scenario;
  let scenarioStartedAt = now();

  const app = new Hono();

  app.get('/__scenario', (c) => c.json({ scenario }));
  app.get('/__scenario/:name', (c) => {
    const name = c.req.param('name');
    if (!isScenario(name)) return c.json({ error: 'unknown scenario' }, 404);
    scenario = name;
    scenarioStartedAt = now();
    return c.json({ scenario });
  });

  for (const [path, endpoint] of ROUTES) {
    app.get(path, async (c) => {
      const response = resolveResponse(scenario, {
        endpoint,
        query: c.req.query(),
        now: now(),
        scenarioStartedAt,
        redPhaseMs,
      });
      if (response.delayMs > 0) await sleep(response.delayMs);
      const body = JSON.stringify(response.body).replaceAll(
        FIXTURE_CIMART_STORAGE,
        `${new URL(c.req.url).origin}/cimart/storage/`,
      );
      return new Response(body, {
        status: response.status,
        headers: { 'content-type': 'application/json' },
      });
    });
  }

  app.get('/cimart/storage/products/:file', (c) =>
    c.req.param('file') === BROKEN_IMAGE_FILE
      ? c.body('not an image', 200, { 'content-type': 'image/jpeg' })
      : c.body(PRODUCT_IMAGE, 200, { 'content-type': 'image/png' }),
  );

  return app;
}
