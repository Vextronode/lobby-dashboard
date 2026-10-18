import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StatusResponse } from '@lobby/contract';
import { afterEach, describe, expect, it } from 'vitest';
import { createHarness, TestClock, tempDataDir, type Harness } from './harness';

const MINUTE_MS = 60_000;

const harnesses: Harness[] = [];
const cleanups: (() => void)[] = [];

afterEach(async () => {
  for (const h of harnesses.splice(0)) await h.close();
  for (const cleanup of cleanups.splice(0)) cleanup();
});

async function track(harness: Promise<Harness>): Promise<Harness> {
  const h = await harness;
  harnesses.push(h);
  return h;
}

async function display(h: Harness) {
  return (await h.json<StatusResponse>('/api/lobby/status')).status.display;
}

describe('status module end to end', () => {
  it('AC-F02-1 (end to end): red-then-orange leaves Awas after two calm syncs, with notice', async () => {
    const h = await track(createHarness({ scenario: 'red-then-orange' }));
    await h.aggregator.syncOne('status');
    expect(await display(h)).toMatchObject({ level: 'RED', awas: true });

    h.clock.advance(2 * MINUTE_MS + 1); // past the mock's 2-minute RED phase → ORANGE
    await h.aggregator.syncOne('status');
    expect(await display(h)).toMatchObject({ level: 'RED', awas: true, source_level: 'ORANGE' });

    h.clock.advance(MINUTE_MS);
    await h.aggregator.syncOne('status');
    expect(await display(h)).toMatchObject({
      level: 'ORANGE',
      awas: false,
      ticker_mode: 'override',
      notice: { text: 'Status Awas telah dicabut, kini: Siaga' },
    });
  });

  it('AC-F01-2 (end to end): ORANGE then sigap-down for 10 minutes → still Siaga, held', async () => {
    const h = await track(createHarness({ scenario: 'orange' }));
    await h.aggregator.syncOne('status');
    await h.setScenario('sigap-down');
    for (let minute = 1; minute <= 10; minute += 1) {
      h.clock.advance(MINUTE_MS);
      await h.aggregator.syncOne('status');
    }
    const { status } = await h.json<StatusResponse>('/api/lobby/status');
    expect(status.state).toBe('stale');
    expect(status.display).toMatchObject({ level: 'ORANGE', stale_hold: true });
  });

  it('AC-F02-3: RED → restart → still Awas before the first sync finishes', async () => {
    const { dir, cleanup } = tempDataDir();
    cleanups.push(cleanup);
    const clock = new TestClock();
    const first = await createHarness({ scenario: 'red', dataDir: dir, clock });
    await first.aggregator.syncOne('status');
    await first.aggregator.stop(); // writes the snapshot

    clock.advance(30_000);
    const second = await track(createHarness({ scenario: 'sigap-down', dataDir: dir, clock }));
    // No sync has run in the new process.
    expect(second.requests).toEqual([]);
    expect(await display(second)).toMatchObject({ level: 'RED', awas: true });
  });

  it('AC-F12-3: a corrupt snapshot is ignored; the aggregator starts with every module loading', async () => {
    const { dir, cleanup } = tempDataDir();
    cleanups.push(cleanup);
    writeFileSync(join(dir, 'snapshot.json'), '{"version": 1, "modules": ');
    const h = await track(createHarness({ dataDir: dir }));
    const content = await h.json<{ modules: Record<string, { state: string }> }>(
      '/api/lobby/content',
    );
    expect(Object.values(content.modules).map((m) => m.state)).toEqual(Array(7).fill('loading'));
    expect((await display(h)).level).toBe('UNKNOWN');
  });

  it('a snapshot from another version is ignored', async () => {
    const { dir, cleanup } = tempDataDir();
    cleanups.push(cleanup);
    writeFileSync(join(dir, 'snapshot.json'), JSON.stringify({ version: 999, modules: {} }));
    const h = await track(createHarness({ dataDir: dir }));
    expect(h.aggregator.entries().status.fetched_at).toBeNull();
  });

  it('F12 R-9: after restart, data is served with its original fetched_at', async () => {
    const { dir, cleanup } = tempDataDir();
    cleanups.push(cleanup);
    const clock = new TestClock();
    const first = await createHarness({ dataDir: dir, clock });
    await first.aggregator.syncOne('weather');
    const fetchedAt = first.aggregator.entries().weather.fetched_at;
    await first.aggregator.stop();

    clock.advance(10 * MINUTE_MS);
    const second = await track(createHarness({ dataDir: dir, clock }));
    const content = await second.json<{
      modules: { weather: { fetched_at: string; age_s: number } };
    }>('/api/lobby/content');
    expect(content.modules.weather).toMatchObject({ fetched_at: fetchedAt, age_s: 600 });
  });
});
