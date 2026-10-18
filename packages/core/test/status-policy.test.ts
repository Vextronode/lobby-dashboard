import type { SigapAlert, StatusPolicyState } from '@lobby/contract';
import { describe, expect, it } from 'vitest';
import {
  evaluateStatus,
  INITIAL_STATUS_POLICY_STATE,
  rawLevelOf,
  tickerModeFor,
  type StatusEvent,
  type StatusPolicyConfig,
} from '../src/status-policy';

const CONFIG: StatusPolicyConfig = {
  staleAfterS: 180,
  holdMaxAgeS: 86_400,
  exitAfterSyncs: 2,
  revokedNoticeMinutes: 10,
};

const T0 = Date.parse('2026-11-02T03:00:00Z');
const at = (offsetS: number) => new Date(T0 + offsetS * 1_000);

function alert(level: string, overrides: Partial<SigapAlert> = {}): SigapAlert {
  return {
    id: `alert-${level}`,
    level,
    description: `Deskripsi ${level}`,
    createdAt: '2026-11-02T02:00:00.000Z',
    basis: 'record',
    expired: false,
    ...overrides,
  };
}

/** Replays a timeline of events and returns every evaluation, like the aggregator does. */
function run(steps: readonly (readonly [offsetS: number, event: StatusEvent])[]) {
  let state: StatusPolicyState = INITIAL_STATUS_POLICY_STATE;
  let fetchedAt: Date | null = null;
  return steps.map(([offsetS, event]) => {
    const now = at(offsetS);
    if (event.kind === 'sync_ok') fetchedAt = now;
    const result = evaluateStatus(state, { event, fetchedAt }, now, CONFIG);
    state = result.nextState;
    return result;
  });
}

const sync = (a: SigapAlert | null): StatusEvent => ({ kind: 'sync_ok', alert: a });
const failed: StatusEvent = { kind: 'sync_failed' };
const read: StatusEvent = { kind: 'read' };

function last<T>(items: readonly T[]): T {
  const item = items.at(-1);
  if (item === undefined) throw new Error('empty timeline');
  return item;
}

describe('rawLevelOf (F01 R-2)', () => {
  it.each([
    ['GREEN record', alert('GREEN'), 'GREEN'],
    ['ORANGE record', alert('ORANGE'), 'ORANGE'],
    [
      'baseline-safe without basis',
      alert('GREEN', { id: 'baseline-safe', basis: undefined }),
      'UNKNOWN',
    ],
    [
      'baseline-safe with basis',
      alert('GREEN', { id: 'baseline-safe', basis: 'fallback' }),
      'UNKNOWN',
    ],
    ['fallback basis, other id', alert('GREEN', { id: 'x', basis: 'fallback' }), 'UNKNOWN'],
    ['live evaluation', alert('YELLOW', { id: 'live-fallback', basis: 'live' }), 'YELLOW'],
    ['unknown level value', alert('PURPLE'), 'UNKNOWN'],
    ['lowercase level', alert('red'), 'UNKNOWN'],
    ['empty answer', null, 'UNKNOWN'],
  ] as const)('%s → %s', (_label, input, level) => {
    expect(rawLevelOf(input)).toBe(level);
  });
});

describe('tickerModeFor (F03 R-1)', () => {
  it.each([
    ['GREEN', 'normal'],
    ['UNKNOWN', 'normal'],
    ['YELLOW', 'priority'],
    ['ORANGE', 'override'],
    ['RED', 'override'],
  ] as const)('%s → %s', (level, mode) => {
    expect(tickerModeFor(level)).toBe(mode);
  });
});

describe('evaluateStatus: display level (F01)', () => {
  it.each([
    ['without basis', { id: 'baseline-safe', basis: undefined }],
    ['with basis', { id: 'baseline-safe', basis: 'fallback' as const }],
  ])('AC-F01-1: baseline-safe %s → "Data tidak terkini", never GREEN', (_label, overrides) => {
    const { display } = last(run([[0, sync(alert('GREEN', overrides))]]));
    expect(display.level).toBe('UNKNOWN');
    expect(display.reason).toBe('Status tidak dapat dipastikan');
    expect(display.stale_hold).toBe(false);
  });

  it('AC-F01-2: ORANGE then SIGAP down 10 minutes → still Siaga, held, with last update time', () => {
    const { display } = last(
      run([
        [0, sync(alert('ORANGE'))],
        [600, failed],
        [600, read],
      ]),
    );
    expect(display).toMatchObject({
      level: 'ORANGE',
      stale_hold: true,
      reason: 'Deskripsi ORANGE',
      ticker_mode: 'override',
      last_updated_at: at(0).toISOString(),
    });
  });

  it('AC-F01-3: YELLOW then SIGAP down 4 minutes → UNKNOWN', () => {
    const { display } = last(
      run([
        [0, sync(alert('YELLOW'))],
        [240, read],
      ]),
    );
    expect(display.level).toBe('UNKNOWN');
    expect(display.stale_hold).toBe(false);
    expect(display.ticker_mode).toBe('normal');
  });

  it.each([
    [180, 'YELLOW'], // exactly 3 × interval: still fresh
    [181, 'UNKNOWN'], // just past
  ] as const)('YELLOW read after %is → %s (F01 R-4 boundary)', (offsetS, level) => {
    expect(
      last(
        run([
          [0, sync(alert('YELLOW'))],
          [offsetS, read],
        ]),
      ).display.level,
    ).toBe(level);
  });

  it.each([
    [86_400, 'ORANGE'], // exactly 24 h: still held
    [86_401, 'UNKNOWN'], // AC-F01-4: past 24 h
  ] as const)('AC-F01-4: ORANGE then SIGAP down %is → %s', (offsetS, level) => {
    expect(
      last(
        run([
          [0, sync(alert('ORANGE'))],
          [offsetS, read],
        ]),
      ).display.level,
    ).toBe(level);
  });

  it('holds ORANGE when SIGAP answers baseline-safe while data is fresh (F01 R-5)', () => {
    const { display } = last(
      run([
        [0, sync(alert('ORANGE'))],
        [60, sync(alert('GREEN', { id: 'baseline-safe', basis: undefined }))],
      ]),
    );
    expect(display).toMatchObject({ level: 'ORANGE', stale_hold: true, source_level: 'UNKNOWN' });
  });

  it('does not hold YELLOW when SIGAP falls back (F01 R-6)', () => {
    const { display } = last(
      run([
        [0, sync(alert('YELLOW'))],
        [60, sync(alert('GREEN', { id: 'baseline-safe' }))],
      ]),
    );
    expect(display.level).toBe('UNKNOWN');
  });

  it.each([
    [
      'GREEN without description',
      alert('GREEN', { description: null }),
      'GREEN',
      'Tidak ada peringatan aktif',
    ],
    [
      'expired alert',
      alert('GREEN', { expired: true, description: 'Lama' }),
      'GREEN',
      'Tidak ada peringatan aktif',
    ],
    ['YELLOW with description', alert('YELLOW'), 'YELLOW', 'Deskripsi YELLOW'],
    ['ORANGE without description', alert('ORANGE', { description: '  ' }), 'ORANGE', 'Siaga'],
  ] as const)('reason for %s (F01 R-8)', (_label, input, level, reason) => {
    expect(last(run([[0, sync(input)]])).display).toMatchObject({ level, reason });
  });

  it('before any successful sync → UNKNOWN without times', () => {
    const { display } = last(
      run([
        [0, failed],
        [10, read],
      ]),
    );
    expect(display).toMatchObject({
      level: 'UNKNOWN',
      source_level: null,
      last_updated_at: null,
      alert_created_at: null,
      awas: false,
    });
  });

  it('does not mutate the previous state', () => {
    const prev = Object.freeze({ ...INITIAL_STATUS_POLICY_STATE });
    expect(() =>
      evaluateStatus(prev, { event: sync(alert('RED')), fetchedAt: at(0) }, at(0), CONFIG),
    ).not.toThrow();
    expect(prev).toEqual(INITIAL_STATUS_POLICY_STATE);
  });
});

describe('evaluateStatus: Awas (F02)', () => {
  it('enters Awas on RED (R-1)', () => {
    const { display } = last(run([[0, sync(alert('RED'))]]));
    expect(display).toMatchObject({ level: 'RED', awas: true, ticker_mode: 'override' });
  });

  it('AC-F02-1: RED → ORANGE stays Awas after 1 sync, leaves after 2 with a 10-minute notice', () => {
    const results = run([
      [0, sync(alert('RED'))],
      [60, sync(alert('ORANGE'))],
      [120, sync(alert('ORANGE'))],
      [120 + 599, read],
      [120 + 600, read],
    ]);
    expect(results[1]?.display).toMatchObject({ level: 'RED', awas: true, source_level: 'ORANGE' });
    expect(results[2]?.display).toMatchObject({
      level: 'ORANGE',
      awas: false,
      notice: { text: 'Status Awas telah dicabut, kini: Siaga', until: at(720).toISOString() },
    });
    expect(results[3]?.display.notice?.text).toBe('Status Awas telah dicabut, kini: Siaga');
    expect(results[4]?.display.notice).toBeNull();
  });

  it('RED → GREEN announces "kini: Aman"', () => {
    const { display } = last(
      run([
        [0, sync(alert('RED'))],
        [60, sync(alert('GREEN', { description: null }))],
        [120, sync(alert('GREEN', { description: null }))],
      ]),
    );
    expect(display.notice?.text).toBe('Status Awas telah dicabut, kini: Aman');
  });

  it('keeps showing the RED reason while counting down', () => {
    const results = run([
      [0, sync(alert('RED'))],
      [60, sync(alert('ORANGE'))],
    ]);
    expect(results[1]?.display.reason).toBe('Deskripsi RED');
  });

  it.each([
    [600, true],
    [23 * 3_600, true],
    [86_400, true],
    [86_401, false], // past the hold window: no longer known, no revoked notice
  ] as const)('AC-F02-2: RED then SIGAP down %is → awas %s', (offsetS, awas) => {
    const { display } = last(
      run([
        [0, sync(alert('RED'))],
        [60, failed],
        [offsetS, read],
      ]),
    );
    expect(display.awas).toBe(awas);
    expect(display.notice).toBeNull();
    if (!awas) expect(display.level).toBe('UNKNOWN');
  });

  it.each([
    ['a failed sync', failed],
    ['an UNKNOWN level', sync(alert('GREEN', { id: 'baseline-safe' }))],
    ['RED again', sync(alert('RED'))],
  ])('R-3: %s between calm syncs resets the exit count', (_label, interruption) => {
    const results = run([
      [0, sync(alert('RED'))],
      [60, sync(alert('ORANGE'))],
      [120, interruption],
      [180, sync(alert('ORANGE'))],
      [240, sync(alert('ORANGE'))],
    ]);
    expect(results[3]?.display.awas).toBe(true);
    expect(results[4]?.display.awas).toBe(false);
  });

  it('R-3: stale data resets the exit count', () => {
    const results = run([
      [0, sync(alert('RED'))],
      [60, sync(alert('ORANGE'))],
      [60 + 181, read], // stale: count back to 0
      [300, sync(alert('ORANGE'))],
      [360, sync(alert('ORANGE'))],
    ]);
    expect(results[2]?.nextState.calm_syncs).toBe(0);
    expect(results[3]?.display.awas).toBe(true);
    expect(results[4]?.display.awas).toBe(false);
  });

  it('keeps Awas in the state so it survives a restart (R-5)', () => {
    const { nextState } = last(run([[0, sync(alert('RED'))]]));
    const afterRestart = evaluateStatus(
      nextState,
      { event: read, fetchedAt: at(0) },
      at(30),
      CONFIG,
    );
    expect(afterRestart.display).toMatchObject({ level: 'RED', awas: true });
  });
});
