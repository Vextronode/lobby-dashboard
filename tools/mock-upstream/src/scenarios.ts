import { fixtures } from './fixtures';

/** Scenarios from LOBBY-01 FR-9. */
export const SCENARIOS = [
  'normal',
  'yellow',
  'orange',
  'red',
  'red-then-orange',
  'sigap-fallback',
  'sigap-down',
  'sid-unpublished',
  'sid-down',
  'cimart-phase0',
  'cimart-phase1',
  'quake-latest-pair',
  'slow',
] as const;

export type Scenario = (typeof SCENARIOS)[number];

export function isScenario(value: string): value is Scenario {
  return (SCENARIOS as readonly string[]).includes(value);
}

export type Endpoint =
  | 'alerts-current'
  | 'quake-pangandaran'
  | 'quake-west-java'
  | 'quake-indonesia'
  | 'quake-recent'
  | 'weather-forecast'
  | 'evacuation-points'
  | 'emergency-contacts'
  | 'sid-population'
  | 'sid-services'
  | 'cimart-summary';

type System = 'sigap' | 'sid' | 'cimart';

const SYSTEM_OF: Readonly<Record<Endpoint, System>> = {
  'alerts-current': 'sigap',
  'quake-pangandaran': 'sigap',
  'quake-west-java': 'sigap',
  'quake-indonesia': 'sigap',
  'quake-recent': 'sigap',
  'weather-forecast': 'sigap',
  'evacuation-points': 'sigap',
  'emergency-contacts': 'sigap',
  'sid-population': 'sid',
  'sid-services': 'sid',
  'cimart-summary': 'cimart',
};

/** Longer than the aggregator's 8 s upstream timeout (LOBBY-02 NFR-3). */
export const SLOW_DELAY_MS = 8_000;

/** Default length of the RED phase in `red-then-orange`, long enough for one RED sync. */
export const DEFAULT_RED_PHASE_MS = 120_000;

const QUAKE_SCOPES = ['west-java', 'indonesia'] as const;
const RECENT_LIMIT = { min: 1, max: 15, default: 9 } as const; // SIGAP-01 FR-B1
const DAY_MS = 86_400_000;
const WIB_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' });

export interface MockRequest {
  readonly endpoint: Endpoint;
  readonly query: Readonly<Record<string, string | undefined>>;
  readonly now: Date;
  /** When the current scenario was activated (drives `red-then-orange`). */
  readonly scenarioStartedAt: Date;
  readonly redPhaseMs: number;
}

export interface MockResponse {
  readonly status: number;
  readonly body: unknown;
  readonly delayMs: number;
}

function respond(body: unknown, status = 200): MockResponse {
  return { status, body, delayMs: 0 };
}

/** Upstream response for one request under the given scenario. */
export function resolveResponse(scenario: Scenario, request: MockRequest): MockResponse {
  const system = SYSTEM_OF[request.endpoint];
  if (scenario === 'slow') {
    return { ...resolveResponse('normal', request), delayMs: SLOW_DELAY_MS };
  }
  if (scenario === 'sigap-down' && system === 'sigap') return respond(fixtures.sigap.error, 502);
  if (scenario === 'sid-down' && system === 'sid') return respond(fixtures.sid.error, 503);

  switch (request.endpoint) {
    case 'alerts-current':
      return respond(alertFor(scenario, request));
    case 'quake-pangandaran':
      return respond(fixtures.sigap.quakePangandaran);
    case 'quake-west-java':
      return respond(fixtures.sigap.quakeWestJava);
    case 'quake-indonesia':
      return respond(fixtures.sigap.quakeIndonesia);
    case 'quake-recent':
      // Before SIGAP-01 ships the route does not exist (F06 R-2).
      if (scenario === 'quake-latest-pair') return respond(fixtures.sigap.notFound, 404);
      return recentQuakes(request.query);
    case 'weather-forecast':
      return respond(weatherFromToday(request.now));
    case 'evacuation-points':
      return respond(fixtures.sigap.evacuationPoints);
    case 'emergency-contacts':
      return respond(fixtures.sigap.emergencyContacts);
    case 'sid-population':
      return respond(
        scenario === 'sid-unpublished'
          ? fixtures.sid.populationUnpublished
          : fixtures.sid.populationPublished,
      );
    case 'sid-services':
      return respond(fixtures.sid.servicesNormal);
    case 'cimart-summary':
      return respond(
        scenario === 'cimart-phase0' ? fixtures.cimart.phase0 : fixtures.cimart.phase1,
      );
  }
}

function alertFor(scenario: Scenario, request: MockRequest): unknown {
  switch (scenario) {
    case 'yellow':
      return fixtures.sigap.alertYellow;
    case 'orange':
      return fixtures.sigap.alertOrange;
    case 'red':
      return fixtures.sigap.alertRed;
    case 'red-then-orange': {
      const elapsedMs = request.now.getTime() - request.scenarioStartedAt.getTime();
      return elapsedMs < request.redPhaseMs ? fixtures.sigap.alertRed : fixtures.sigap.alertOrange;
    }
    case 'sigap-fallback':
      // Current SIGAP behaviour (no `basis` yet): GREEN although nothing is known (K-N1).
      return fixtures.sigap.alertBaselineSafe;
    default:
      return fixtures.sigap.alertGreen;
  }
}

/** Mirrors SIGAP-01 FR-B1: `scope` required, `limit` 1–15 (default 9); invalid → 400. */
function recentQuakes(query: MockRequest['query']): MockResponse {
  const scope = QUAKE_SCOPES.find((candidate) => candidate === query.scope);
  const limit = query.limit === undefined ? RECENT_LIMIT.default : Number(query.limit);
  if (
    scope === undefined ||
    !Number.isInteger(limit) ||
    limit < RECENT_LIMIT.min ||
    limit > RECENT_LIMIT.max
  ) {
    return respond({ success: false, message: 'Parameter tidak valid.' }, 400);
  }
  const source =
    scope === 'west-java' ? fixtures.sigap.recentWestJava : fixtures.sigap.recentIndonesia;
  return respond({ ...source, data: source.data.slice(0, limit) });
}

/** Shifts the static forecast so its first day is today in WIB, keeping dev data realistic. */
function weatherFromToday(now: Date): unknown {
  const source = fixtures.sigap.weatherForecast;
  const todayWib = Date.parse(`${WIB_DATE.format(now)}T00:00:00Z`);
  return {
    ...source,
    data: source.data.map((day, index) => ({
      ...day,
      date: new Date(todayWib + index * DAY_MS).toISOString().slice(0, 10),
    })),
  };
}
