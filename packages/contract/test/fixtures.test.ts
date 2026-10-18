import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  cimartErrorSchema,
  cimartSummarySchema,
  sidErrorSchema,
  sidPopulationSchema,
  sidServicesSchema,
  sigapAlertResponseSchema,
  sigapEmergencyContactsResponseSchema,
  sigapErrorSchema,
  sigapEvacuationPointsResponseSchema,
  sigapLatestQuakeResponseSchema,
  sigapRecentQuakesResponseSchema,
  sigapWeatherResponseSchema,
} from '../src/index';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

/** Fixture file name prefix → schema it must satisfy. Every fixture must match one rule. */
const SCHEMA_RULES: readonly (readonly [prefix: string, schema: z.ZodType])[] = [
  ['sigap/alerts-current.', sigapAlertResponseSchema],
  ['sigap/earthquakes-recent.', sigapRecentQuakesResponseSchema],
  ['sigap/earthquakes-pangandaran.', sigapLatestQuakeResponseSchema],
  ['sigap/earthquakes-west-java.', sigapLatestQuakeResponseSchema],
  ['sigap/earthquakes-indonesia.', sigapLatestQuakeResponseSchema],
  ['sigap/weather-forecast.', sigapWeatherResponseSchema],
  ['sigap/evacuation-points.', sigapEvacuationPointsResponseSchema],
  ['sigap/emergency-contacts.', sigapEmergencyContactsResponseSchema],
  ['sigap/error', sigapErrorSchema],
  ['sid/population.', sidPopulationSchema],
  ['sid/services.', sidServicesSchema],
  ['sid/error', sidErrorSchema],
  ['cimart/lobby-summary.', cimartSummarySchema],
  ['cimart/error', cimartErrorSchema],
];

/** Keys that must never appear in any fixture (guidelines §2.3). */
const FORBIDDEN_KEYS = new Set([
  'nik',
  'kk',
  'no_kk',
  'date_of_birth',
  'birth_date',
  'income',
  'email',
  'user_id',
  'owner',
  'applicant_name',
  'applicant_nik',
  'applicant_address',
]);

function listFixtures(): string[] {
  return readdirSync(FIXTURES_DIR, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.json'))
    .map((path) => relative(FIXTURES_DIR, join(FIXTURES_DIR, path)).replaceAll('\\', '/'))
    .sort();
}

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, name), 'utf8'));
}

function schemaFor(name: string): z.ZodType | undefined {
  return SCHEMA_RULES.find(([prefix]) => name.startsWith(prefix))?.[1];
}

function collectKeys(value: unknown, keys: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      collectKeys(child, keys);
    }
  }
  return keys;
}

/** Deep copy of a fixture with one change applied, for negative tests. */
function mutated(name: string, mutate: (fixture: Record<string, unknown>) => void): unknown {
  const fixture = structuredClone(readFixture(name)) as Record<string, unknown>;
  mutate(fixture);
  return fixture;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

describe('contract fixtures', () => {
  const fixtures = listFixtures();

  it('has fixtures for every upstream endpoint', () => {
    for (const [prefix] of SCHEMA_RULES) {
      expect(
        fixtures.some((name) => name.startsWith(prefix)),
        prefix,
      ).toBe(true);
    }
  });

  it.each(fixtures)('AC-3: %s passes its schema', (name) => {
    const schema = schemaFor(name);
    expect(schema, `no schema rule for ${name}`).toBeDefined();
    const result = schema?.safeParse(readFixture(name));
    expect(result?.error).toBeUndefined();
  });

  it.each(fixtures)('%s contains no personal data keys', (name) => {
    const leaked = collectKeys(readFixture(name)).filter((key) => FORBIDDEN_KEYS.has(key));
    expect(leaked).toEqual([]);
  });
});

describe('AC-3: broken fixtures fail validation', () => {
  const cases: readonly {
    readonly name: string;
    readonly fixture: string;
    readonly schema: z.ZodType;
    readonly mutate: (fixture: Record<string, unknown>) => void;
  }[] = [
    {
      name: 'alert without level',
      fixture: 'sigap/alerts-current.orange.json',
      schema: sigapAlertResponseSchema,
      mutate: (f) => {
        delete asRecord(f.data).level;
      },
    },
    {
      name: 'alert with unknown basis',
      fixture: 'sigap/alerts-current.green.json',
      schema: sigapAlertResponseSchema,
      mutate: (f) => {
        asRecord(f.data).basis = 'guess';
      },
    },
    {
      name: 'error envelope sent as success',
      fixture: 'sigap/alerts-current.green.json',
      schema: sigapAlertResponseSchema,
      mutate: (f) => {
        f.success = false;
      },
    },
    {
      name: 'quake distance as string',
      fixture: 'sigap/earthquakes-pangandaran.normal.json',
      schema: sigapLatestQuakeResponseSchema,
      mutate: (f) => {
        asRecord(f.data).distanceToVillage = '62 km';
      },
    },
    {
      name: 'recent quakes as single object',
      fixture: 'sigap/earthquakes-west-java.normal.json',
      schema: sigapRecentQuakesResponseSchema,
      mutate: () => undefined,
    },
    {
      name: 'weather date not ISO',
      fixture: 'sigap/weather-forecast.normal.json',
      schema: sigapWeatherResponseSchema,
      mutate: (f) => {
        const days = f.data as Record<string, unknown>[];
        asRecord(days[0]).date = '02-11-2026';
      },
    },
    {
      name: 'evacuation point without isCore',
      fixture: 'sigap/evacuation-points.normal.json',
      schema: sigapEvacuationPointsResponseSchema,
      mutate: (f) => {
        const points = f.data as Record<string, unknown>[];
        delete asRecord(points[0]).isCore;
      },
    },
    {
      name: 'published population without totals',
      fixture: 'sid/population.published.json',
      schema: sidPopulationSchema,
      mutate: (f) => {
        delete f.population;
      },
    },
    {
      name: 'unpublished population flagged as published',
      fixture: 'sid/population.unpublished.json',
      schema: sidPopulationSchema,
      mutate: (f) => {
        f.published = true;
      },
    },
    {
      name: 'letters trend with 11 weeks',
      fixture: 'sid/services.normal.json',
      schema: sidServicesSchema,
      mutate: (f) => {
        const letters = asRecord(f.letters);
        letters.weekly = (letters.weekly as unknown[]).slice(1);
      },
    },
    {
      name: 'product price as string',
      fixture: 'cimart/lobby-summary.phase1.json',
      schema: cimartSummarySchema,
      mutate: (f) => {
        const products = f.featured_products as Record<string, unknown>[];
        asRecord(products[0]).price = '15000';
      },
    },
    {
      name: 'product image_url not a URL',
      fixture: 'cimart/lobby-summary.phase1.json',
      schema: cimartSummarySchema,
      mutate: (f) => {
        const products = f.featured_products as Record<string, unknown>[];
        asRecord(products[0]).image_url = 'storage/products/a.jpg';
      },
    },
    {
      name: 'error body without message',
      fixture: 'sid/error.json',
      schema: sidErrorSchema,
      mutate: (f) => {
        delete f.message;
      },
    },
  ];

  it.each(cases)('rejects $name', ({ fixture, schema, mutate }) => {
    expect(schema.safeParse(mutated(fixture, mutate)).success).toBe(false);
  });
});

describe('whitelist parsing (guidelines §2.2)', () => {
  it('strips fields SID adds outside the contract', () => {
    const withExtra = mutated('sid/population.published.json', (f) => {
      f.nik = '3200000000000000';
    });
    const parsed = sidPopulationSchema.parse(withExtra);
    expect(collectKeys(parsed)).not.toContain('nik');
  });

  it('strips fields CiMart adds outside the contract', () => {
    const withExtra = mutated('cimart/lobby-summary.phase1.json', (f) => {
      const products = f.featured_products as Record<string, unknown>[];
      asRecord(asRecord(products[0]).store).address = 'Jalan Contoh 1';
    });
    const parsed = cimartSummarySchema.parse(withExtra);
    expect(collectKeys(parsed)).not.toContain('address');
  });

  it('strips SIGAP alert reviewer fields (officer names)', () => {
    const withReviewer = mutated('sigap/alerts-current.orange.json', (f) => {
      Object.assign(asRecord(f.data), { reviewedBy: 'user-1', reviewer: { name: 'Petugas' } });
    });
    const keys = collectKeys(sigapAlertResponseSchema.parse(withReviewer));
    expect(keys).not.toContain('reviewer');
    expect(keys).not.toContain('reviewedBy');
  });

  it('keeps an unknown SIGAP level so the policy can treat it as UNKNOWN (F01 R-2)', () => {
    const withUnknownLevel = mutated('sigap/alerts-current.green.json', (f) => {
      asRecord(f.data).level = 'PURPLE';
    });
    expect(sigapAlertResponseSchema.parse(withUnknownLevel).data?.level).toBe('PURPLE');
  });
});
