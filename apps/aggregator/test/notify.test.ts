import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTelegramNotifier, type Audience, type Notifier } from '../src/notify/notifier';
import {
  evaluateNotifications,
  INITIAL_NOTIFICATION_STATE,
  isWithinOperatingHours,
  type ModuleHealth,
  type NotificationInputs,
  type NotificationState,
} from '../src/notify/rules';
import type { FetchLike } from '../src/sources/http-client';
import { createHarness, tempDataDir, TestClock, testConfig, type Harness } from './harness';

const HOURS = testConfig().operating_hours;
const MONDAY_10 = new Date('2026-11-02T03:00:00Z'); // Monday 10.00 WIB
const MINUTE_MS = 60_000;

function inputs(overrides: Partial<NotificationInputs>): NotificationInputs {
  return {
    modules: [],
    devices: [],
    now: MONDAY_10,
    monitoringSince: new Date(MONDAY_10.getTime() - 60 * MINUTE_MS),
    operatingHours: HOURS,
    ...overrides,
  };
}

function sid(
  failures: number,
  firstFailureAt: Date | null = new Date('2026-11-02T02:05:00Z'),
): ModuleHealth {
  return {
    id: 'sid_population',
    consecutiveFailures: failures,
    firstFailureAt,
    fetchedAt: new Date('2026-11-02T01:55:00Z'),
  };
}

/** Feeds a sequence of failure counts through the rules, like successive syncs. */
function replay(failureCounts: readonly number[], stepMs = MINUTE_MS) {
  let state: NotificationState = INITIAL_NOTIFICATION_STATE;
  const sent: string[] = [];
  failureCounts.forEach((failures, index) => {
    const now = new Date(MONDAY_10.getTime() + index * stepMs);
    const decision = evaluateNotifications(state, inputs({ now, modules: [sid(failures)] }));
    sent.push(...decision.messages.map((m) => `${m.audience}: ${m.text}`));
    state = decision.nextState;
  });
  return sent;
}

describe('notification rules (F14)', () => {
  it('AC-F14-1: 5 failures → exactly 1 tech message; 10 → still 1; recovery → 1 message', () => {
    const sent = replay([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0]);
    expect(sent).toEqual([
      'tech: SID tidak bisa dihubungi sejak 09.05 (5× gagal). Card penduduk menampilkan data per 08.55.',
      'tech: SID kembali terhubung pukul 10.10. Semua card kembali memakai data terbaru.',
    ]);
  });

  it('groups per system: SIGAP down across modules → 1 message listing every failing card', () => {
    const at = (minute: number) => new Date(MONDAY_10.getTime() + minute * MINUTE_MS);
    const sigap = (id: ModuleHealth['id'], failures: number): ModuleHealth => ({
      id,
      consecutiveFailures: failures,
      firstFailureAt: failures > 0 ? at(-failures) : null,
      fetchedAt: new Date('2026-11-02T02:50:00Z'),
    });
    const down = evaluateNotifications(
      INITIAL_NOTIFICATION_STATE,
      inputs({
        modules: [sigap('status', 5), sigap('weather', 1), sigap('quake_list', 4), sid(2)],
      }),
    );
    expect(down.messages).toEqual([
      {
        audience: 'tech',
        text: 'SIGAP tidak bisa dihubungi sejak 09.55 (5× gagal). Card status kesiapsiagaan menampilkan data per 09.50; Card gempa Jabar/Indonesia menampilkan data per 09.50; Card cuaca menampilkan data per 09.50.',
      },
    ]);

    // One SIGAP module is back but another still fails: not recovered, nothing new to send.
    const partly = evaluateNotifications(
      down.nextState,
      inputs({ now: at(1), modules: [sigap('status', 0), sigap('weather', 2)] }),
    );
    expect(partly.messages).toEqual([]);

    const back = evaluateNotifications(
      partly.nextState,
      inputs({ now: at(2), modules: [sigap('status', 0), sigap('weather', 0)] }),
    );
    expect(back.messages).toEqual([
      {
        audience: 'tech',
        text: 'SIGAP kembali terhubung pukul 10.02. Semua card kembali memakai data terbaru.',
      },
    ]);
  });

  it('R-2: reminds every 6 hours while still failing', () => {
    const sent = replay([5, 6, 7, 8], 3 * 60 * MINUTE_MS); // every 3 h
    expect(sent).toHaveLength(2);
    expect(sent[1]).toBe(
      'tech: SID masih tidak bisa dihubungi sejak 09.05. Card penduduk menampilkan data per 08.55.',
    );
  });

  it.each([
    ['Monday 10.00 WIB', '2026-11-02T03:00:00Z', 1],
    ['Monday 20.00 WIB', '2026-11-02T13:00:00Z', 0],
    ['Saturday 10.00 WIB', '2026-11-07T03:00:00Z', 0],
  ])('AC-F14-2: TV silent 6 minutes on %s → %i admin message(s)', (_label, instant, count) => {
    const now = new Date(instant);
    const decision = evaluateNotifications(
      INITIAL_NOTIFICATION_STATE,
      inputs({
        now,
        devices: [{ id: 'tv-lobby-1', lastSeen: new Date(now.getTime() - 6 * MINUTE_MS) }],
      }),
    );
    expect(decision.messages).toHaveLength(count);
    if (count === 1) {
      expect(decision.messages[0]).toEqual({
        audience: 'admin',
        text: `Layar TV lobby tidak tersambung sejak ${instant === '2026-11-02T03:00:00Z' ? '09.54' : ''}. Coba cabut-colok perangkat TV/kiosk dan cek WiFi.`,
      });
    }
  });

  it('R-3: 5 minutes exactly is not yet silent; recovery goes to the same group', () => {
    const device = (lastSeen: Date) => [{ id: 'tv-lobby-1', lastSeen }];
    const quiet = evaluateNotifications(
      INITIAL_NOTIFICATION_STATE,
      inputs({ devices: device(new Date(MONDAY_10.getTime() - 5 * MINUTE_MS)) }),
    );
    expect(quiet.messages).toEqual([]);

    const down = evaluateNotifications(
      INITIAL_NOTIFICATION_STATE,
      inputs({ devices: device(new Date(MONDAY_10.getTime() - 6 * MINUTE_MS)) }),
    );
    const later = new Date(MONDAY_10.getTime() + 10 * MINUTE_MS);
    const back = evaluateNotifications(
      down.nextState,
      inputs({ now: later, devices: device(later) }),
    );
    expect(back.messages).toEqual([
      { audience: 'admin', text: 'Layar TV lobby tersambung kembali 10.10.' },
    ]);
  });

  it('a TV never seen counts as silent from the start of monitoring', () => {
    const decision = evaluateNotifications(
      INITIAL_NOTIFICATION_STATE,
      inputs({ devices: [{ id: 'tv-lobby-1', lastSeen: null }] }),
    );
    expect(decision.messages).toHaveLength(1);
  });

  it.each([
    ['06.59', '2026-11-01T23:59:00Z', false],
    ['07.00', '2026-11-02T00:00:00Z', true],
    ['15.59', '2026-11-02T08:59:00Z', true],
    ['16.00', '2026-11-02T09:00:00Z', false],
  ])('R-4: Monday %s WIB within operating hours → %s', (_label, instant, expected) => {
    expect(isWithinOperatingHours(new Date(instant), HOURS)).toBe(expected);
  });
});

describe('Telegram notifier (F14 R-8, R-9)', () => {
  function capture() {
    const calls: { url: string; body: { chat_id: string; text: string } }[] = [];
    const fetchImpl = vi.fn<FetchLike>((url, init) => {
      calls.push({
        url,
        body: JSON.parse(init?.body as string) as { chat_id: string; text: string },
      });
      return Promise.resolve(Response.json({ ok: true }));
    });
    return { calls, fetchImpl };
  }

  it.each([
    ['tech', 'tech-chat', 'admin-chat', 'tech-chat'],
    ['admin', 'tech-chat', 'admin-chat', 'admin-chat'],
    ['admin', 'tech-chat', undefined, 'tech-chat'], // R-9
  ] as const)('%s message with admin chat %s → %s', async (audience, tech, admin, expected) => {
    const { calls, fetchImpl } = capture();
    await createTelegramNotifier({
      token: 'T',
      techChatId: tech,
      adminChatId: admin,
      fetchImpl,
    }).send(audience, 'halo');
    expect(calls[0]?.body).toEqual({ chat_id: expected, text: 'halo' });
  });

  it('errors never reveal the token', async () => {
    const notifier = createTelegramNotifier({
      token: 'SECRET-TOKEN',
      techChatId: 'c',
      adminChatId: undefined,
      fetchImpl: () =>
        Promise.reject(new Error('connect ECONNREFUSED https://api.telegram.org/botSECRET-TOKEN')),
    });
    await expect(notifier.send('tech', 'x')).rejects.toThrow('telegram_network');
  });
});

describe('notifications in the aggregator', () => {
  let harness: Harness | undefined;
  const cleanups: (() => void)[] = [];
  afterEach(async () => {
    await harness?.close();
    harness = undefined;
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  function recordingNotifier(fail = false) {
    const sent: { audience: Audience; text: string }[] = [];
    const notifier: Notifier = {
      enabled: true,
      send: (audience, text) => {
        sent.push({ audience, text });
        return fail ? Promise.reject(new Error('telegram_network')) : Promise.resolve();
      },
    };
    return { sent, notifier };
  }

  it('AC-F14-3: Telegram unreachable → syncs and API keep working', async () => {
    const { sent, notifier } = recordingNotifier(true);
    harness = await createHarness({ scenario: 'sid-down', notifier });
    for (let i = 0; i < 6; i += 1) await harness.aggregator.syncOne('sid_population');
    expect(sent.length).toBe(1);
    expect((await harness.get('/api/lobby/content')).status).toBe(200);
    expect(harness.aggregator.entries().sid_population.consecutive_failures).toBe(6);
  });

  it('AC-5: a "down" message is not sent again after a restart', async () => {
    const { dir, cleanup } = tempDataDir();
    cleanups.push(cleanup);
    const clock = new TestClock();
    const first = recordingNotifier();
    const before = await createHarness({
      scenario: 'sid-down',
      notifier: first.notifier,
      dataDir: dir,
      clock,
    });
    for (let i = 0; i < 5; i += 1) await before.aggregator.syncOne('sid_population');
    await before.aggregator.stop();
    expect(first.sent.filter((m) => m.text.includes('SID tidak bisa dihubungi'))).toHaveLength(1);

    const second = recordingNotifier();
    clock.advance(MINUTE_MS);
    harness = await createHarness({
      scenario: 'sid-down',
      notifier: second.notifier,
      dataDir: dir,
      clock,
    });
    for (let i = 0; i < 3; i += 1) await harness.aggregator.syncOne('sid_population');
    expect(second.sent).toEqual([]);
  });
});
