import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadConfig, parseConfig, parseEnv } from '../src/config/load-config';

const CONFIG_PATH = fileURLToPath(new URL('../../../config/lobby.config.json', import.meta.url));

function committedConfig(): Record<string, unknown> {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as Record<string, unknown>;
}

function withChange(change: (config: Record<string, unknown>) => void): Record<string, unknown> {
  const config = committedConfig();
  change(config);
  return config;
}

function record(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function expectRejected(raw: unknown, fieldPath: string): void {
  const result = parseConfig(raw, 'test');
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.message).toContain(fieldPath);
}

describe('committed config/lobby.config.json', () => {
  const loaded = loadConfig(CONFIG_PATH);

  it('is valid', () => {
    expect(loaded.ok ? undefined : loaded.message).toBeUndefined();
  });

  // F12 R-3: interval and max age per module; F12 R-6: backoff cap 15 min, status 2 min.
  it.each([
    ['status', 60, 86_400, 120],
    ['quake_pangandaran', 60, 86_400, 900],
    ['quake_list', 60, 86_400, 900],
    ['weather', 900, 86_400, 900],
    ['preparedness', 3_600, 604_800, 900],
    ['sid_population', 3_600, 604_800, 900],
    ['sid_services', 900, 86_400, 900],
    ['cimart', 900, 86_400, 900],
  ] as const)('%s timing matches F12 R-3/R-6', (module, intervalS, maxAgeS, maxBackoffS) => {
    if (!loaded.ok) throw new Error(loaded.message);
    expect(loaded.value.modules[module]).toMatchObject({
      interval_s: intervalS,
      max_age_s: maxAgeS,
      max_backoff_s: maxBackoffS,
    });
  });

  it('matches the remaining spec defaults (F02, F06, F09, F04, F14)', () => {
    if (!loaded.ok) throw new Error(loaded.message);
    const config = loaded.value;
    expect(config.stale_factor).toBe(3);
    expect(config.modules.quake_list).toMatchObject({ mode: 'recent', limit: 9 });
    expect(config.awas).toEqual({
      evacuation_point_ids: [],
      max_points: 3,
      exit_after_syncs: 2,
      revoked_notice_minutes: 10,
    });
    expect(config.cimart).toEqual({ phase1_min_products: 3, max_products: 8, show_photos: true });
    expect(config.weather_icons._default).toBe('cloud');
    expect(Object.keys(config.weather_icons)).toHaveLength(14);
    expect(config.app_links.map((link) => link.id)).toEqual(['sigap', 'sid', 'cimart']);
    expect(config.operating_hours).toEqual({ start: '07:00', end: '16:00', days: [1, 2, 3, 4, 5] });
  });
});

describe('config validation', () => {
  it('AC-F03-5: rejects config with fewer than 3 tips', () => {
    expectRejected(
      withChange((c) => {
        c.tips = ['Siapkan tas siaga.', 'Kenali jalur evakuasi.'];
      }),
      'tips',
    );
  });

  it.each([
    [
      'AC-4: missing tips',
      'tips',
      (c: Record<string, unknown>) => {
        delete c.tips;
      },
    ],
    [
      'AC-4: interval_s 0',
      'modules.status.interval_s',
      (c: Record<string, unknown>) => {
        record(record(c.modules).status).interval_s = 0;
      },
    ],
    [
      'blank tip',
      'tips.0',
      (c: Record<string, unknown>) => {
        (c.tips as string[])[0] = '   ';
      },
    ],
    [
      'misspelled key',
      'modules',
      (c: Record<string, unknown>) => {
        record(c.modules).wether = { interval_s: 1, max_age_s: 1, max_backoff_s: 1 };
      },
    ],
    [
      'weather icons without _default',
      'weather_icons._default',
      (c: Record<string, unknown>) => {
        delete record(c.weather_icons)._default;
      },
    ],
    [
      'unknown weather icon',
      'weather_icons.Cerah',
      (c: Record<string, unknown>) => {
        record(c.weather_icons).Cerah = 'sunny';
      },
    ],
    [
      'duplicate app link ids',
      'app_links',
      (c: Record<string, unknown>) => {
        const links = c.app_links as Record<string, unknown>[];
        record(links[2]).id = 'sigap';
      },
    ],
    [
      'quake list limit above SIGAP maximum',
      'modules.quake_list.limit',
      (c: Record<string, unknown>) => {
        record(record(c.modules).quake_list).limit = 99;
      },
    ],
    [
      'operating hours not HH:MM',
      'operating_hours.start',
      (c: Record<string, unknown>) => {
        record(c.operating_hours).start = '7';
      },
    ],
  ])('rejects %s and names %s', (_label, fieldPath, change) => {
    expectRejected(withChange(change), fieldPath);
  });

  it('reports a missing file without crashing', () => {
    const result = loadConfig('does-not-exist.json');
    expect(result.ok).toBe(false);
  });
});

describe('environment validation', () => {
  const validEnv = {
    SIGAP_BASE_URL: 'http://localhost:8090/sigap',
    SID_BASE_URL: 'http://localhost:8090/sid',
    CIMART_BASE_URL: 'http://localhost:8090/cimart',
  };

  it('applies defaults', () => {
    const result = parseEnv(validEnv);
    expect(result.ok && result.value).toMatchObject({ DATA_DIR: './data', PORT: 8080 });
  });

  it('names the missing variable', () => {
    const { SID_BASE_URL: _omitted, ...rest } = validEnv;
    const result = parseEnv(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('SID_BASE_URL');
  });

  it('never echoes values back (guidelines §2.6)', () => {
    const result = parseEnv({ ...validEnv, SIGAP_BASE_URL: 'secret-internal-host', PORT: 'abc' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).not.toContain('secret-internal-host');
  });
});
