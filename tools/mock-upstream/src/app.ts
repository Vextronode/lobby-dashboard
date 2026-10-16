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
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { 'content-type': 'application/json' },
      });
    });
  }

  return app;
}
