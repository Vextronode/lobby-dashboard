import type {
  ContentResponse,
  MetaResponse,
  ModuleEnvelope,
  ModuleState,
  StatusPolicyState,
  StatusResponse,
} from '@lobby/contract';
import {
  cimartPhase,
  evaluateStatus,
  moduleFreshness,
  selectForecastDays,
  type FreshnessPolicy,
  type StatusPolicyConfig,
} from '@lobby/core';
import type { CacheEntry, ModuleEntries } from '../cache/cache-store';
import type { LobbyConfig } from '../config/config-schema';
import { MODULE_IDS, type ModuleId } from './module-data';

const MS_PER_S = 1_000;

function toDate(iso: string | null): Date | null {
  return iso === null ? null : new Date(iso);
}

export function freshnessPolicyFor(config: LobbyConfig, module: ModuleId): FreshnessPolicy {
  const timing = config.modules[module];
  return {
    intervalS: timing.interval_s,
    staleFactor: config.stale_factor,
    maxAgeS: timing.max_age_s,
  };
}

export function statusPolicyConfigFor(config: LobbyConfig): StatusPolicyConfig {
  const timing = config.modules.status;
  return {
    staleAfterS: timing.interval_s * config.stale_factor,
    holdMaxAgeS: timing.max_age_s,
    exitAfterSyncs: config.awas.exit_after_syncs,
    revokedNoticeMinutes: config.awas.revoked_notice_minutes,
  };
}

/**
 * Envelope computed at read time (F12 R-2, FR-C4): data is sent only while `ok` or `stale`, so data
 * past the max age is never shown (F12 R-5).
 */
export function toEnvelope<T, U>(
  entry: CacheEntry<T>,
  now: Date,
  policy: FreshnessPolicy,
  present: (data: T, state: ModuleState) => U,
): ModuleEnvelope<U> {
  const freshness = moduleFreshness(
    { fetchedAt: toDate(entry.fetched_at), lastAttemptAt: toDate(entry.last_attempt_at) },
    now,
    policy,
  );
  const hasData = freshness.state === 'ok' || freshness.state === 'stale';
  return {
    state: freshness.state,
    fetched_at: entry.fetched_at,
    age_s: freshness.ageS,
    data: hasData && entry.data !== null ? present(entry.data, freshness.state) : null,
  };
}

function same<T>(data: T): T {
  return data;
}

export interface StatusPresentation {
  readonly response: StatusResponse;
  readonly nextState: StatusPolicyState;
}

/** `GET /api/lobby/status`; also returns the policy state to keep (stale data resets Awas count). */
export function presentStatus(
  entry: ModuleEntries['status'],
  policyState: StatusPolicyState,
  now: Date,
  config: LobbyConfig,
  build: string,
): StatusPresentation {
  const evaluation = evaluateStatus(
    policyState,
    { event: { kind: 'read' }, fetchedAt: toDate(entry.fetched_at) },
    now,
    statusPolicyConfigFor(config),
  );
  const envelope = toEnvelope(entry, now, freshnessPolicyFor(config, 'status'), same);
  return {
    response: {
      server_time: now.toISOString(),
      build,
      status: { ...envelope, display: evaluation.display },
    },
    nextState: evaluation.nextState,
  };
}

/** `GET /api/lobby/content`. */
export function presentContent(
  entries: Readonly<ModuleEntries>,
  now: Date,
  config: LobbyConfig,
  build: string,
): ContentResponse {
  const policy = (module: ModuleId) => freshnessPolicyFor(config, module);
  return {
    server_time: now.toISOString(),
    build,
    modules: {
      weather: toEnvelope(entries.weather, now, policy('weather'), (days) =>
        selectForecastDays(days, now, config.weather_icons),
      ),
      quake_pangandaran: toEnvelope(
        entries.quake_pangandaran,
        now,
        policy('quake_pangandaran'),
        same,
      ),
      quake_list: toEnvelope(entries.quake_list, now, policy('quake_list'), same),
      preparedness: toEnvelope(entries.preparedness, now, policy('preparedness'), same),
      sid_population: toEnvelope(entries.sid_population, now, policy('sid_population'), same),
      sid_services: toEnvelope(entries.sid_services, now, policy('sid_services'), same),
      cimart: toEnvelope(entries.cimart, now, policy('cimart'), (data, state) => ({
        ...data,
        phase: cimartPhase(state, data.featured_products.length, config.cimart.phase1_min_products),
      })),
    },
    static: { tips: config.tips, app_links: config.app_links, public_url: config.public_url },
  };
}

/** `http_502` → `status_502`: `/meta` must not contain the string "http" (LOBBY-02 AC-3). */
export function publicErrorKind(kind: string | null): string | null {
  return kind?.replace(/^http_/, 'status_') ?? null;
}

export interface MetaInputs {
  readonly entries: Readonly<ModuleEntries>;
  readonly nextRunAt: (module: ModuleId) => Date | null;
  readonly devices: Readonly<Record<string, string | null>>;
  readonly startedAt: Date;
}

/** `GET /api/lobby/meta` (FR-E3): health only, no URLs, headers, env names, or stack traces. */
export function presentMeta(
  inputs: MetaInputs,
  now: Date,
  config: LobbyConfig,
  build: string,
): MetaResponse {
  const modules = Object.fromEntries(
    MODULE_IDS.map((id) => {
      const entry = inputs.entries[id];
      const { state } = moduleFreshness(
        { fetchedAt: toDate(entry.fetched_at), lastAttemptAt: toDate(entry.last_attempt_at) },
        now,
        freshnessPolicyFor(config, id),
      );
      return [
        id,
        {
          state,
          fetched_at: entry.fetched_at,
          last_attempt_at: entry.last_attempt_at,
          consecutive_failures: entry.consecutive_failures,
          last_error_kind: publicErrorKind(entry.last_error_kind),
          last_latency_ms: entry.last_latency_ms,
          next_run_at: inputs.nextRunAt(id)?.toISOString() ?? null,
        },
      ];
    }),
  );
  return {
    server_time: now.toISOString(),
    build,
    uptime_s: Math.max(0, Math.floor((now.getTime() - inputs.startedAt.getTime()) / MS_PER_S)),
    modules,
    devices: Object.fromEntries(
      Object.entries(inputs.devices).map(([id, lastSeen]) => [id, { last_seen: lastSeen }]),
    ),
  };
}
