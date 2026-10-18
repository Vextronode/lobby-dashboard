import {
  cimartSummarySchema,
  sidPopulationSchema,
  sidServicesSchema,
  sigapAlertResponseSchema,
  sigapEmergencyContactsResponseSchema,
  sigapEvacuationPointsResponseSchema,
  sigapLatestQuakeResponseSchema,
  sigapRecentQuakesResponseSchema,
  sigapWeatherResponseSchema,
} from '@lobby/contract';
import { describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';
import { createMockApp } from '../src/app';
import { SCENARIOS, SLOW_DELAY_MS, type Scenario } from '../src/scenarios';

const PATHS = {
  alert: '/sigap/api/public/alerts/current',
  pangandaran: '/sigap/api/public/earthquakes/pangandaran',
  westJava: '/sigap/api/public/earthquakes/west-java',
  indonesia: '/sigap/api/public/earthquakes/indonesia',
  recentWestJava: '/sigap/api/public/earthquakes/recent?scope=west-java',
  recentIndonesia: '/sigap/api/public/earthquakes/recent?scope=indonesia',
  weather: '/sigap/api/public/weather/forecast',
  evacuation: '/sigap/api/public/evacuation-points',
  contacts: '/sigap/api/public/emergency-contacts',
  population: '/sid/api/public/lobby/population?village_code=3218032001',
  services: '/sid/api/public/lobby/services?village_code=3218032001',
  cimart: '/cimart/api/public/lobby-summary',
} as const;

const SCHEMA_BY_PATH: readonly (readonly [path: string, schema: z.ZodType])[] = [
  [PATHS.alert, sigapAlertResponseSchema],
  [PATHS.pangandaran, sigapLatestQuakeResponseSchema],
  [PATHS.westJava, sigapLatestQuakeResponseSchema],
  [PATHS.indonesia, sigapLatestQuakeResponseSchema],
  [PATHS.recentWestJava, sigapRecentQuakesResponseSchema],
  [PATHS.recentIndonesia, sigapRecentQuakesResponseSchema],
  [PATHS.weather, sigapWeatherResponseSchema],
  [PATHS.evacuation, sigapEvacuationPointsResponseSchema],
  [PATHS.contacts, sigapEmergencyContactsResponseSchema],
  [PATHS.population, sidPopulationSchema],
  [PATHS.services, sidServicesSchema],
  [PATHS.cimart, cimartSummarySchema],
];

const T0 = new Date('2026-11-02T03:00:00Z');
const RED_PHASE_MS = 60_000;

interface Fetched {
  readonly status: number;
  readonly body: Record<string, unknown>;
}

function setup(options: { now?: () => Date; sleep?: (ms: number) => Promise<void> } = {}) {
  const app = createMockApp({ scenario: 'normal', redPhaseMs: RED_PHASE_MS, ...options });
  return {
    async get(path: string): Promise<Fetched> {
      const response = await app.request(path);
      return { status: response.status, body: (await response.json()) as Record<string, unknown> };
    },
    async activate(scenario: Scenario): Promise<void> {
      const response = await app.request(`/__scenario/${scenario}`);
      expect(response.status).toBe(200);
    },
  };
}

function dataOf(fetched: Fetched): Record<string, unknown> {
  return fetched.body.data as Record<string, unknown>;
}

function arrayLength(value: unknown): number {
  return (value as unknown[]).length;
}

describe('AC-5: every scenario changes the related endpoints', () => {
  const cases: readonly {
    readonly scenario: Scenario;
    readonly path: string;
    readonly expectStatus: number;
    readonly check: (fetched: Fetched) => void;
  }[] = [
    {
      scenario: 'normal',
      path: PATHS.alert,
      expectStatus: 200,
      check: (f) => {
        expect(dataOf(f).level).toBe('GREEN');
      },
    },
    {
      scenario: 'yellow',
      path: PATHS.alert,
      expectStatus: 200,
      check: (f) => {
        expect(dataOf(f).level).toBe('YELLOW');
      },
    },
    {
      scenario: 'orange',
      path: PATHS.alert,
      expectStatus: 200,
      check: (f) => {
        expect(dataOf(f).level).toBe('ORANGE');
      },
    },
    {
      scenario: 'red',
      path: PATHS.alert,
      expectStatus: 200,
      check: (f) => {
        expect(dataOf(f).level).toBe('RED');
      },
    },
    {
      scenario: 'sigap-fallback',
      path: PATHS.alert,
      expectStatus: 200,
      check: (f) => {
        expect(dataOf(f)).toMatchObject({ id: 'baseline-safe', level: 'GREEN' });
        expect(dataOf(f)).not.toHaveProperty('basis');
      },
    },
    {
      scenario: 'sigap-down',
      path: PATHS.alert,
      expectStatus: 502,
      check: (f) => {
        expect(f.body.success).toBe(false);
      },
    },
    {
      scenario: 'sigap-down',
      path: PATHS.weather,
      expectStatus: 502,
      check: (f) => {
        expect(f.body.success).toBe(false);
      },
    },
    {
      scenario: 'sigap-down',
      path: PATHS.population,
      expectStatus: 200,
      check: (f) => {
        expect(f.body.published).toBe(true);
      },
    },
    {
      scenario: 'sid-unpublished',
      path: PATHS.population,
      expectStatus: 200,
      check: (f) => {
        expect(f.body).toEqual({ published: false, generated_at: expect.any(String) as unknown });
      },
    },
    {
      scenario: 'sid-down',
      path: PATHS.population,
      expectStatus: 503,
      check: (f) => {
        expect(f.body).toHaveProperty('message');
      },
    },
    {
      scenario: 'sid-down',
      path: PATHS.services,
      expectStatus: 503,
      check: (f) => {
        expect(f.body).toHaveProperty('message');
      },
    },
    {
      scenario: 'sid-down',
      path: PATHS.alert,
      expectStatus: 200,
      check: (f) => {
        expect(dataOf(f).level).toBe('GREEN');
      },
    },
    {
      scenario: 'cimart-phase0',
      path: PATHS.cimart,
      expectStatus: 200,
      check: (f) => {
        expect(arrayLength(f.body.featured_products)).toBe(2);
      },
    },
    {
      scenario: 'cimart-phase1',
      path: PATHS.cimart,
      expectStatus: 200,
      check: (f) => {
        expect(arrayLength(f.body.featured_products)).toBe(10);
      },
    },
    {
      scenario: 'quake-latest-pair',
      path: PATHS.recentWestJava,
      expectStatus: 404,
      check: (f) => {
        expect(f.body.success).toBe(false);
      },
    },
    {
      scenario: 'quake-latest-pair',
      path: PATHS.westJava,
      expectStatus: 200,
      check: (f) => {
        expect(dataOf(f)).toHaveProperty('magnitude');
      },
    },
    {
      scenario: 'normal',
      path: PATHS.recentWestJava,
      expectStatus: 200,
      check: (f) => {
        expect(arrayLength(f.body.data)).toBe(4);
      },
    },
  ];

  it.each(cases)(
    '$scenario → $path returns $expectStatus',
    async ({ scenario, path, expectStatus, check }) => {
      const mock = setup();
      await mock.activate(scenario);
      const fetched = await mock.get(path);
      expect(fetched.status).toBe(expectStatus);
      check(fetched);
    },
  );

  it('red-then-orange: RED first, ORANGE after the red phase', async () => {
    let now = T0;
    const mock = setup({ now: () => now });
    await mock.activate('red-then-orange');
    expect(dataOf(await mock.get(PATHS.alert)).level).toBe('RED');
    now = new Date(T0.getTime() + RED_PHASE_MS - 1);
    expect(dataOf(await mock.get(PATHS.alert)).level).toBe('RED');
    now = new Date(T0.getTime() + RED_PHASE_MS);
    expect(dataOf(await mock.get(PATHS.alert)).level).toBe('ORANGE');
  });

  it('slow: delays every upstream response by 8 s', async () => {
    const sleep = vi.fn(() => Promise.resolve());
    const mock = setup({ sleep });
    await mock.activate('slow');
    for (const path of [PATHS.alert, PATHS.population, PATHS.cimart]) {
      expect((await mock.get(path)).status).toBe(200);
    }
    expect(sleep).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledWith(SLOW_DELAY_MS);
  });

  it('covers all scenarios of LOBBY-01 FR-9', () => {
    const tested = new Set<string>([...cases.map((c) => c.scenario), 'red-then-orange', 'slow']);
    expect([...SCENARIOS].filter((scenario) => !tested.has(scenario))).toEqual([]);
  });
});

describe('scenario control', () => {
  it('rejects an unknown scenario name', async () => {
    const response = await createMockApp({ scenario: 'normal' }).request('/__scenario/bandung');
    expect(response.status).toBe(404);
  });

  it('starts with the scenario given at boot (MOCK_SCENARIO)', async () => {
    const response = await createMockApp({ scenario: 'orange' }).request(PATHS.alert);
    expect(((await response.json()) as { data: { level: string } }).data.level).toBe('ORANGE');
  });
});

describe('responses follow @lobby/contract', () => {
  it.each(SCENARIOS)('%s: every 200 response passes its upstream schema', async (scenario) => {
    const mock = setup({ sleep: () => Promise.resolve() });
    await mock.activate(scenario);
    for (const [path, schema] of SCHEMA_BY_PATH) {
      const fetched = await mock.get(path);
      if (fetched.status === 200)
        expect(schema.safeParse(fetched.body).error, path).toBeUndefined();
    }
  });
});

describe('earthquakes/recent parameters (SIGAP-01 FR-B1)', () => {
  it.each([
    ['?scope=bandung', 400],
    ['?limit=3', 400],
    ['?scope=west-java&limit=99', 400],
    ['?scope=west-java&limit=0', 400],
    ['?scope=indonesia&limit=15', 200],
  ])('%s → %i', async (query, status) => {
    const fetched = await setup().get(`/sigap/api/public/earthquakes/recent${query}`);
    expect(fetched.status).toBe(status);
  });

  it('applies limit', async () => {
    const fetched = await setup().get(`${PATHS.recentIndonesia}&limit=3`);
    expect(arrayLength(fetched.body.data)).toBe(3);
  });
});

describe('weather forecast dates', () => {
  it.each([
    ['2026-11-02T16:30:00Z', '2026-11-02'], // 23.30 WIB is still 2 Nov
    ['2026-11-02T17:00:00Z', '2026-11-03'], // 00.00 WIB on 3 Nov
    ['2026-11-30T18:00:00Z', '2026-12-01'], // month boundary in WIB
  ])('at %s the first day is %s (WIB)', async (instant, firstDate) => {
    const fetched = await setup({ now: () => new Date(instant) }).get(PATHS.weather);
    const days = fetched.body.data as { date: string }[];
    expect(days[0]?.date).toBe(firstDate);
    expect(days).toHaveLength(5);
  });
});
