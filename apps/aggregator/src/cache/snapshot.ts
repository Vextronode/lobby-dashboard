import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { statusPolicyStateSchema, utcDateTimeSchema } from '@lobby/contract';
import { z } from 'zod';
import { moduleDataSchemas } from '../modules/module-data';
import { notificationStateSchema } from '../notify/rules';
import type { Logger } from '../observability/logger';
import { cacheEntrySchema } from './cache-store';

/** Bump when the snapshot shape changes; older snapshots are then ignored (FR-C3). */
export const SNAPSHOT_VERSION = 2;

/** FR-C2: at most one write per 5 s. */
export const SNAPSHOT_MIN_INTERVAL_MS = 5_000;

export const snapshotSchema = z.object({
  version: z.literal(SNAPSHOT_VERSION),
  saved_at: utcDateTimeSchema,
  modules: z.object({
    status: cacheEntrySchema(moduleDataSchemas.status).optional(),
    quake_pangandaran: cacheEntrySchema(moduleDataSchemas.quake_pangandaran).optional(),
    quake_list: cacheEntrySchema(moduleDataSchemas.quake_list).optional(),
    weather: cacheEntrySchema(moduleDataSchemas.weather).optional(),
    preparedness: cacheEntrySchema(moduleDataSchemas.preparedness).optional(),
    sid_population: cacheEntrySchema(moduleDataSchemas.sid_population).optional(),
    sid_services: cacheEntrySchema(moduleDataSchemas.sid_services).optional(),
    cimart: cacheEntrySchema(moduleDataSchemas.cimart).optional(),
  }),
  policy_state: statusPolicyStateSchema,
  devices: z.record(z.string(), utcDateTimeSchema),
  notifications: notificationStateSchema,
});

export type Snapshot = z.infer<typeof snapshotSchema>;

/**
 * Loads `DATA_DIR/snapshot.json`. Missing, unreadable, corrupt, or other-version files return `null`
 * with a warning, so start-up always succeeds (FR-C3, AC-F12-3).
 */
export async function readSnapshot(path: string, logger: Logger): Promise<Snapshot | null> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    logger.info('no snapshot, starting empty');
    return null;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    logger.warn({ error_kind: 'snapshot_corrupt' }, 'snapshot ignored');
    return null;
  }
  const parsed = snapshotSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn({ error_kind: 'snapshot_invalid' }, 'snapshot ignored');
    return null;
  }
  return parsed.data;
}

export interface SnapshotWriterOptions {
  readonly path: string;
  readonly collect: () => Snapshot;
  readonly logger: Logger;
  readonly now: () => Date;
  readonly minIntervalMs?: number;
}

/** Throttled, atomic snapshot writes: temp file then rename (FR-C2). */
export class SnapshotWriter {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastWriteAt = Number.NEGATIVE_INFINITY;
  private writing: Promise<void> = Promise.resolve();

  constructor(private readonly options: SnapshotWriterOptions) {}

  /** Requests a write; coalesces requests within the minimum interval. */
  schedule(): void {
    if (this.timer !== null) return;
    const minIntervalMs = this.options.minIntervalMs ?? SNAPSHOT_MIN_INTERVAL_MS;
    const waitMs = Math.max(0, this.lastWriteAt + minIntervalMs - this.options.now().getTime());
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.write();
    }, waitMs);
  }

  /** Writes now (shutdown). Pending scheduled writes are folded into this one. */
  async flush(): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.write();
  }

  /** Resolves when no write is in progress. */
  idle(): Promise<void> {
    return this.writing;
  }

  private write(): Promise<void> {
    this.lastWriteAt = this.options.now().getTime();
    // Captured now, so the file reflects the state at the time of the request.
    const content = JSON.stringify(this.options.collect());
    this.writing = this.writing.then(async () => {
      const temporary = `${this.options.path}.tmp`;
      try {
        await mkdir(dirname(this.options.path), { recursive: true });
        await writeFile(temporary, content);
        await rename(temporary, this.options.path);
      } catch (error) {
        this.options.logger.error(
          { err: error, error_kind: 'snapshot_write' },
          'snapshot write failed',
        );
      }
    });
    return this.writing;
  }
}
