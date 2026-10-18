import type { SigapEarthquake, SigapEvacuationPoint, SigapWeatherDay } from '@lobby/contract';
import { describe, expect, it } from 'vitest';
import { cimartPhase } from '../src/cimart';
import { moduleFreshness } from '../src/freshness';
import { selectEmergencyContacts, selectEvacuationPoints } from '../src/preparedness';
import { mergeQuakeLists } from '../src/quakes';
import { selectForecastDays, weatherIconFor, type WeatherIconMap } from '../src/weather';

describe('moduleFreshness (F12 R-2)', () => {
  const T = Date.parse('2026-11-02T03:00:00Z');
  const status = { intervalS: 60, staleFactor: 3, maxAgeS: 86_400 };
  const at = (s: number) => new Date(T + s * 1_000);

  it.each([
    ['never attempted', null, null, 0, 'loading', null],
    ['attempted, never succeeded', null, 0, 10, 'unavailable', null],
    ['just fetched', 0, 0, 0, 'ok', 0],
    ['exactly 3 × interval', 0, 0, 180, 'ok', 180],
    ['AC-F12-1: 181 s', 0, 0, 181, 'stale', 181],
    ['exactly max age', 0, 0, 86_400, 'stale', 86_400],
    ['past max age', 0, 0, 86_401, 'unavailable', 86_401],
    ['clock behind fetch time', 10, 10, 0, 'ok', 0],
  ] as const)('%s → %s', (_label, fetchedS, attemptS, nowS, state, ageS) => {
    const result = moduleFreshness(
      {
        fetchedAt: fetchedS === null ? null : at(fetchedS),
        lastAttemptAt: attemptS === null ? null : at(attemptS),
      },
      at(nowS),
      status,
    );
    expect(result).toEqual({ state, ageS });
  });
});

function quake(
  updatedAt: string,
  magnitude: number,
  latitude: number,
  longitude: number,
): SigapEarthquake {
  return {
    magnitude,
    depth: '10 km',
    location: `Lokasi ${updatedAt}`,
    coordinates: { latitude, longitude },
    distanceToVillage: 100,
    potential: '',
    updatedAt,
  };
}

describe('mergeQuakeLists (F06 R-3 to R-5)', () => {
  const shared = quake('2026-11-01T21:15:42.000Z', 4.1, -7.214, 108.356);

  it('AC-F06-1: an event in both scopes appears once, tagged Jabar', () => {
    const sameEventOtherFormat = quake('2026-11-01T21:15:42Z', 4.1, -7.2141, 108.3559);
    const merged = mergeQuakeLists([shared], [sameEventOtherFormat], 9);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.tag).toBe('Jabar');
  });

  it('keeps distinct events with the same time but different magnitude', () => {
    const other = quake('2026-11-01T21:15:42.000Z', 4.2, -7.214, 108.356);
    expect(mergeQuakeLists([shared], [other], 9)).toHaveLength(2);
  });

  it('sorts newest first and applies the limit', () => {
    const items = [1, 2, 3, 4, 5, 6].map((day) =>
      quake(`2026-10-0${String(day)}T00:00:00Z`, 4 + day / 10, -8, 110),
    );
    const merged = mergeQuakeLists(items.slice(0, 2), items.slice(2), 4);
    expect(merged.map((item) => item.quake.updatedAt)).toEqual([
      '2026-10-06T00:00:00Z',
      '2026-10-05T00:00:00Z',
      '2026-10-04T00:00:00Z',
      '2026-10-03T00:00:00Z',
    ]);
    expect(merged.map((item) => item.tag)).toEqual([
      'Indonesia',
      'Indonesia',
      'Indonesia',
      'Indonesia',
    ]);
  });

  it('handles empty inputs', () => {
    expect(mergeQuakeLists([], [], 9)).toEqual([]);
  });
});

const ICONS: WeatherIconMap = { _default: 'cloud', Cerah: 'sun', 'Hujan Lebat': 'rain-heavy' };

function day(date: string, condition = 'Cerah'): SigapWeatherDay {
  return { date, condition, temperature: 30, rainProbability: 20, label: 'Hari Ini' };
}

describe('selectForecastDays (F04 R-1 to R-4)', () => {
  const fiveDays = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'].map((d) =>
    day(d),
  );

  it('AC-F04-1: drops yesterday (WIB) and labels today/tomorrow/the day after', () => {
    const selected = selectForecastDays(fiveDays, new Date('2026-11-02T03:00:00Z'), ICONS);
    expect(selected.map((d) => [d.date, d.day_offset])).toEqual([
      ['2026-11-02', 0],
      ['2026-11-03', 1],
      ['2026-11-04', 2],
    ]);
  });

  it.each([
    ['AC-F04-3: 23.30 WIB (16.30 UTC) is still 2 Nov', '2026-11-02T16:30:00Z', '2026-11-02'],
    ['00.00 WIB is the next day', '2026-11-02T17:00:00Z', '2026-11-03'],
  ])('%s', (_label, instant, firstDate) => {
    expect(selectForecastDays(fiveDays, new Date(instant), ICONS)[0]?.date).toBe(firstDate);
  });

  it('handles the month boundary in WIB', () => {
    const days = ['2026-11-30', '2026-12-01', '2026-12-02'].map((d) => day(d));
    const selected = selectForecastDays(days, new Date('2026-11-30T17:00:00Z'), ICONS);
    expect(selected.map((d) => d.date)).toEqual(['2026-12-01', '2026-12-02']);
  });

  it('never labels a day beyond "Lusa" when SIGAP skips a date', () => {
    const days = ['2026-11-02', '2026-11-05'].map((d) => day(d));
    const selected = selectForecastDays(days, new Date('2026-11-02T03:00:00Z'), ICONS);
    expect(selected.map((d) => d.day_offset)).toEqual([0]);
  });

  it('maps fields and returns [] for an empty forecast', () => {
    expect(selectForecastDays([], new Date('2026-11-02T03:00:00Z'), ICONS)).toEqual([]);
    const [first] = selectForecastDays(
      [day('2026-11-02')],
      new Date('2026-11-02T03:00:00Z'),
      ICONS,
    );
    expect(first).toEqual({
      date: '2026-11-02',
      day_offset: 0,
      condition: 'Cerah',
      icon: 'sun',
      temperature_max_c: 30,
      rain_probability_pct: 20,
    });
  });

  it.each([
    ['Cerah', 'sun'],
    ['Hujan Lebat', 'rain-heavy'],
    ['AC-F04-2: Salju', 'cloud'],
    ['_default', 'cloud'],
    ['toString', 'cloud'],
  ])('icon for %s → %s', (condition, icon) => {
    expect(weatherIconFor(condition.replace('AC-F04-2: ', ''), ICONS)).toBe(icon);
  });
});

describe('cimartPhase (F09 R-4)', () => {
  it.each([
    ['ok', 2, 0], // AC-F09-3: 2 products → phase 0
    ['ok', 3, 1],
    ['ok', 12, 1], // AC-F09-3: 12 products → phase 1
    ['stale', 3, 1],
    ['unavailable', 8, 0],
    ['loading', 8, 0],
  ] as const)('%s with %i products → phase %i', (state, count, phase) => {
    expect(cimartPhase(state, count, 3)).toBe(phase);
  });
});

function point(id: string, isCore: boolean): SigapEvacuationPoint {
  return { id, name: `Titik ${id}`, address: null, isCore };
}

describe('selectEvacuationPoints (F02 R-6)', () => {
  const points = [
    point('id-a', true),
    point('id-b', true),
    point('id-c', true),
    point('id-d', true),
    point('id-e', false),
  ];

  it('AC-F02-4: empty config → isCore points in SIGAP order, max 3', () => {
    expect(selectEvacuationPoints(points, [], 3).map((p) => p.id)).toEqual([
      'id-a',
      'id-b',
      'id-c',
    ]);
  });

  it('AC-F02-4: config ["id-b","id-a"] → b, a', () => {
    expect(selectEvacuationPoints(points, ['id-b', 'id-a'], 3).map((p) => p.id)).toEqual([
      'id-b',
      'id-a',
    ]);
  });

  it('skips configured IDs SIGAP does not know and still caps at the maximum', () => {
    expect(
      selectEvacuationPoints(points, ['id-x', 'id-e', 'id-d', 'id-c', 'id-b'], 3).map((p) => p.id),
    ).toEqual(['id-e', 'id-d', 'id-c']);
  });
});

describe('selectEmergencyContacts (F02 R-7)', () => {
  it('puts isCore first and keeps at most 4', () => {
    const contacts = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, index) => ({
      id,
      institution: id,
      phoneNumber: '112',
      isCore: index % 2 === 1,
    }));
    expect(selectEmergencyContacts(contacts).map((c) => c.id)).toEqual(['b', 'd', 'f', 'a']);
  });
});
