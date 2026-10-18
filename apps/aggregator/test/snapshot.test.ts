import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INITIAL_STATUS_POLICY_STATE } from '@lobby/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  readSnapshot,
  SNAPSHOT_VERSION,
  SnapshotWriter,
  type Snapshot,
} from '../src/cache/snapshot';
import { INITIAL_NOTIFICATION_STATE } from '../src/notify/rules';
import { silentLogger, T0, tempDataDir } from './harness';

function snapshot(): Snapshot {
  return {
    version: SNAPSHOT_VERSION,
    saved_at: new Date().toISOString(),
    modules: {},
    policy_state: INITIAL_STATUS_POLICY_STATE,
    devices: { 'tv-lobby-1': T0.toISOString() },
    notifications: INITIAL_NOTIFICATION_STATE,
  };
}

describe('SnapshotWriter (FR-C2)', () => {
  let cleanup: () => void;
  let path: string;

  beforeEach(() => {
    vi.useFakeTimers({ now: T0, toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const temp = tempDataDir();
    cleanup = temp.cleanup;
    path = join(temp.dir, 'nested', 'snapshot.json');
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('writes atomically and at most once per 5 s', async () => {
    const collect = vi.fn(snapshot);
    const writer = new SnapshotWriter({
      path,
      collect,
      logger: silentLogger,
      now: () => new Date(),
    });

    writer.schedule();
    await vi.advanceTimersByTimeAsync(0);
    expect(collect).toHaveBeenCalledTimes(1);
    await writer.idle();
    expect(existsSync(`${path}.tmp`)).toBe(false);
    expect(await readSnapshot(path, silentLogger)).toMatchObject({
      devices: { 'tv-lobby-1': T0.toISOString() },
    });

    writer.schedule();
    writer.schedule();
    writer.schedule();
    await vi.advanceTimersByTimeAsync(4_999);
    expect(collect).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(collect).toHaveBeenCalledTimes(2);
  });

  it('flush() writes immediately and cancels the pending write', async () => {
    const collect = vi.fn(snapshot);
    const writer = new SnapshotWriter({
      path,
      collect,
      logger: silentLogger,
      now: () => new Date(),
    });
    writer.schedule();
    await writer.flush();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(collect).toHaveBeenCalledTimes(1);
    expect(JSON.parse(readFileSync(path, 'utf8'))).toMatchObject({ version: SNAPSHOT_VERSION });
  });
});

describe('readSnapshot (FR-C3)', () => {
  it('returns null for a missing file', async () => {
    expect(await readSnapshot(join(tempDataDir().dir, 'none.json'), silentLogger)).toBeNull();
  });
});
