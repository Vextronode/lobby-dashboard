import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryCacheStore } from '../src/cache/cache-store';
import { nextDelayS } from '../src/scheduler/backoff';
import { Scheduler, START_STAGGER_MS, type SchedulerJob } from '../src/scheduler/scheduler';
import { syncModule } from '../src/modules/sync-module';
import { presentStatus } from '../src/modules/present';
import { INITIAL_STATUS_POLICY_STATE } from '@lobby/core';
import { silentLogger, T0, testConfig } from './harness';
import { success } from '../src/sources/http-client';

describe('nextDelayS (F12 R-6)', () => {
  it.each([
    [0, 60, 120, 60],
    [2, 60, 120, 60],
    [3, 60, 120, 120], // × 2 after 3 failures, status capped at 2 min
    [6, 60, 120, 120],
    [3, 900, 900, 900], // 15-minute modules are already at the 15-minute cap
    [3, 60, 900, 120],
    [4, 60, 900, 240], // × 4
    [10, 60, 900, 900], // capped
    [5, 3_600, 900, 3_600], // never faster than the normal interval
  ])('%i failures, interval %is, cap %is → %is', (failures, intervalS, capS, delayS) => {
    expect(nextDelayS(failures, intervalS, capS)).toBe(delayS);
  });
});

describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: T0 });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function job(id: SchedulerJob['id'], runMs: number, delayMs: number) {
    const runs: number[] = [];
    let active = 0;
    let maxActive = 0;
    const scheduled: SchedulerJob = {
      id,
      async run() {
        runs.push(Date.now());
        active += 1;
        maxActive = Math.max(maxActive, active);
        if (runMs > 0) await new Promise((resolve) => setTimeout(resolve, runMs));
        active -= 1;
        return { consecutiveFailures: 0 };
      },
      delayAfterMs: () => delayMs,
    };
    return { scheduled, runs, maxActive: () => maxActive };
  }

  it('FR-A1: starts modules 2 s apart', async () => {
    const a = job('status', 0, 60_000);
    const b = job('weather', 0, 60_000);
    const scheduler = new Scheduler([a.scheduled, b.scheduled], () => new Date(), silentLogger);
    scheduler.start();
    await vi.advanceTimersByTimeAsync(START_STAGGER_MS);
    expect(a.runs).toEqual([T0.getTime()]);
    expect(b.runs).toEqual([T0.getTime() + START_STAGGER_MS]);
    scheduler.stop();
  });

  it('FR-A2: a slow sync never overlaps the next one of the same module', async () => {
    const slow = job('status', 90_000, 60_000);
    const scheduler = new Scheduler([slow.scheduled], () => new Date(), silentLogger);
    scheduler.start();
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(slow.maxActive()).toBe(1);
    // Next run starts 60 s after the previous one finished: every 150 s.
    expect(slow.runs.slice(0, 3).map((t) => t - T0.getTime())).toEqual([0, 150_000, 300_000]);
    scheduler.stop();
  });

  it('stop() clears every timer', async () => {
    const a = job('status', 0, 60_000);
    const scheduler = new Scheduler([a.scheduled], () => new Date(), silentLogger);
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    scheduler.stop();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(a.runs).toHaveLength(1);
    expect(scheduler.isRunning()).toBe(false);
  });

  it('a crashing job is logged and keeps its schedule', async () => {
    let calls = 0;
    const crashing: SchedulerJob = {
      id: 'status',
      run: () => {
        calls += 1;
        return Promise.reject(new Error('bug'));
      },
      delayAfterMs: () => 60_000,
    };
    const scheduler = new Scheduler([crashing], () => new Date(), silentLogger);
    scheduler.start();
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(calls).toBe(3);
    scheduler.stop();
  });

  it('AC-F12-1: status ok at T, scheduler stopped, clock +181 s → stale, nothing written', async () => {
    const config = testConfig();
    const set = vi.fn();
    const cache = new MemoryCacheStore({}, set);
    const now = () => new Date();
    const alert = {
      id: 'a',
      level: 'GREEN',
      createdAt: T0.toISOString(),
      basis: 'record' as const,
    };
    const scheduler = new Scheduler(
      [
        {
          id: 'status',
          run: async () => {
            const entry = await syncModule('status', () => Promise.resolve(success(alert)), {
              cache,
              now,
              logger: silentLogger,
            });
            return { consecutiveFailures: entry.consecutive_failures };
          },
          delayAfterMs: () => 60_000,
        },
      ],
      now,
      silentLogger,
    );
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    scheduler.stop();
    expect(set).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(181_000);
    const { response } = presentStatus(
      cache.get('status'),
      INITIAL_STATUS_POLICY_STATE,
      now(),
      config,
      'b',
    );
    expect(response.status.state).toBe('stale');
    expect(response.status.age_s).toBe(181);
    expect(set).toHaveBeenCalledTimes(1);
  });
});
