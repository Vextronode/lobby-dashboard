import { join } from 'node:path';
import type { StatusPolicyState } from '@lobby/contract';
import { evaluateStatus, INITIAL_STATUS_POLICY_STATE } from '@lobby/core';
import type { Context, Hono } from 'hono';
import { MemoryCacheStore, type ModuleEntries } from './cache/cache-store';
import { readSnapshot, SNAPSHOT_VERSION, SnapshotWriter, type Snapshot } from './cache/snapshot';
import type { LobbyConfig } from './config/config-schema';
import type { Env } from './config/env-schema';
import { DeviceRegistry } from './devices/devices';
import { createApp } from './http/app';
import { ThumbnailStore } from './images/thumbnails';
import { MODULE_IDS, type ModuleId } from './modules/module-data';
import {
  presentContent,
  presentMeta,
  presentStatus,
  statusPolicyConfigFor,
} from './modules/present';
import { createModuleFetchers } from './modules/registry';
import { syncModule } from './modules/sync-module';
import { createTelegramNotifier, disabledNotifier, type Notifier } from './notify/notifier';
import { INITIAL_NOTIFICATION_STATE, type NotificationInputs } from './notify/rules';
import { NotificationService } from './notify/service';
import type { Logger } from './observability/logger';
import { nextDelayS } from './scheduler/backoff';
import { Scheduler, type SchedulerJob } from './scheduler/scheduler';
import { createUpstreamClient, type FetchLike } from './sources/http-client';

const MS_PER_S = 1_000;
/** How often TV silence is checked besides after each sync (F14 R-3). */
export const NOTIFY_CHECK_INTERVAL_MS = 30_000;

export interface AggregatorDeps {
  readonly env: Env;
  readonly config: LobbyConfig;
  readonly fetchImpl: FetchLike;
  readonly now: () => Date;
  readonly logger: Logger;
  /** Client key for rate limiting; defaults to a single shared key. */
  readonly clientKey?: (c: Context) => string;
  /** Override for tests; defaults to Telegram when configured. */
  readonly notifier?: Notifier;
}

export interface Aggregator {
  readonly app: Hono;
  start(): void;
  stop(): Promise<void>;
  /** Runs every module once, in order (tests and tooling). */
  syncAll(): Promise<void>;
  syncOne(module: ModuleId): Promise<void>;
  entries(): Readonly<ModuleEntries>;
}

function notifierFor(deps: AggregatorDeps): Notifier {
  if (deps.notifier !== undefined) return deps.notifier;
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_TECH: techChatId } = deps.env;
  if (token === undefined || techChatId === undefined) {
    deps.logger.info('notifications disabled (no Telegram token or tech chat)');
    return disabledNotifier;
  }
  return createTelegramNotifier({
    token,
    techChatId,
    adminChatId: deps.env.TELEGRAM_CHAT_ADMIN,
    fetchImpl: deps.fetchImpl,
  });
}

function toDate(iso: string | null): Date | null {
  return iso === null ? null : new Date(iso);
}

/** Composition root: builds the whole aggregator around injectable fetch, clock, and logger. */
export async function createAggregator(deps: AggregatorDeps): Promise<Aggregator> {
  const { env, config, logger, now } = deps;
  const startedAt = now();
  const snapshotPath = join(env.DATA_DIR, 'snapshot.json');
  const snapshot = await readSnapshot(snapshotPath, logger);

  let policyState: StatusPolicyState = snapshot?.policy_state ?? INITIAL_STATUS_POLICY_STATE;
  const devices = new DeviceRegistry(config.devices, snapshot?.devices);

  // `collect` runs only when a write happens, after `cache` and `notifications` exist.
  const writer = new SnapshotWriter({
    path: snapshotPath,
    logger,
    now,
    collect: (): Snapshot => ({
      version: SNAPSHOT_VERSION,
      saved_at: now().toISOString(),
      modules: cache.all(),
      policy_state: policyState,
      devices: devices.toSnapshot(),
      notifications: notifications.getState(),
    }),
  });
  const requestSnapshot = () => {
    writer.schedule();
  };

  const cache = new MemoryCacheStore(snapshot?.modules ?? {}, requestSnapshot);
  const notifications = new NotificationService(
    notifierFor(deps),
    logger,
    snapshot?.notifications ?? INITIAL_NOTIFICATION_STATE,
    requestSnapshot,
  );

  const thumbnails = new ThumbnailStore({
    dir: join(env.DATA_DIR, 'img'),
    allowedOrigin: new URL(env.CIMART_BASE_URL).origin,
    fetchImpl: deps.fetchImpl,
    logger,
    now,
  });
  const fetchers = createModuleFetchers({
    config,
    logger,
    now,
    thumbnails,
    clients: {
      sigap: createUpstreamClient(env.SIGAP_BASE_URL, deps.fetchImpl),
      sid: createUpstreamClient(env.SID_BASE_URL, deps.fetchImpl),
      cimart: createUpstreamClient(env.CIMART_BASE_URL, deps.fetchImpl),
    },
  });

  const setPolicyState = (next: StatusPolicyState) => {
    if (JSON.stringify(next) === JSON.stringify(policyState)) return;
    policyState = next;
    requestSnapshot();
  };

  const notificationInputs = (): NotificationInputs => {
    const entries = cache.all();
    const lastSeen = devices.lastSeen();
    return {
      now: now(),
      monitoringSince: startedAt,
      operatingHours: config.operating_hours,
      modules: MODULE_IDS.map((id) => ({
        id,
        consecutiveFailures: entries[id].consecutive_failures,
        firstFailureAt: toDate(entries[id].first_failure_at),
        fetchedAt: toDate(entries[id].fetched_at),
      })),
      devices: config.devices.map((id) => ({ id, lastSeen: toDate(lastSeen[id] ?? null) })),
    };
  };
  const checkNotifications = () => notifications.evaluate(notificationInputs());

  async function syncOne(module: ModuleId): Promise<number> {
    const entry = await syncModule(module, fetchers[module], { cache, now, logger });
    if (module === 'status') {
      const status = cache.get('status');
      const { nextState } = evaluateStatus(
        policyState,
        {
          event:
            entry.consecutive_failures === 0
              ? { kind: 'sync_ok', alert: status.data }
              : { kind: 'sync_failed' },
          fetchedAt: toDate(status.fetched_at),
        },
        now(),
        statusPolicyConfigFor(config),
      );
      setPolicyState(nextState);
    }
    if (module === 'cimart' && entry.consecutive_failures === 0) {
      await thumbnails.removeUnused();
    }
    await checkNotifications();
    return entry.consecutive_failures;
  }

  const jobs: SchedulerJob[] = MODULE_IDS.map((id) => ({
    id,
    run: async () => ({ consecutiveFailures: await syncOne(id) }),
    delayAfterMs: (failures) =>
      nextDelayS(failures, config.modules[id].interval_s, config.modules[id].max_backoff_s) *
      MS_PER_S,
  }));
  const scheduler = new Scheduler(jobs, now, logger);
  let notifyTimer: ReturnType<typeof setInterval> | null = null;

  const app = createApp({
    now,
    logger,
    webDistDir: env.WEB_DIST_DIR,
    clientKey: deps.clientKey ?? (() => 'shared'),
    isHealthy: () => scheduler.isRunning(),
    thumbnailFile: (key) => thumbnails.fileForKey(key),
    status: (at, deviceId) => {
      if (deviceId !== undefined && devices.see(deviceId, at)) requestSnapshot();
      const { response, nextState } = presentStatus(
        cache.get('status'),
        policyState,
        at,
        config,
        env.BUILD_ID,
      );
      setPolicyState(nextState);
      return response;
    },
    content: (at) => presentContent(cache.all(), at, config, env.BUILD_ID),
    meta: (at) =>
      presentMeta(
        {
          entries: cache.all(),
          nextRunAt: (id) => scheduler.nextRunAt(id),
          devices: devices.lastSeen(),
          startedAt,
        },
        at,
        config,
        env.BUILD_ID,
      ),
  });

  return {
    app,
    start() {
      scheduler.start();
      notifyTimer = setInterval(() => {
        void checkNotifications();
      }, NOTIFY_CHECK_INTERVAL_MS);
    },
    async stop() {
      scheduler.stop();
      if (notifyTimer !== null) clearInterval(notifyTimer);
      notifyTimer = null;
      await writer.flush();
    },
    async syncAll() {
      for (const id of MODULE_IDS) await syncOne(id);
    },
    async syncOne(module) {
      await syncOne(module);
    },
    entries: () => cache.all(),
  };
}
