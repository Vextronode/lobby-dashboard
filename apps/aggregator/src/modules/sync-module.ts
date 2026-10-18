import type { CacheEntry, CacheStore } from '../cache/cache-store';
import type { Logger } from '../observability/logger';
import type { FetchResult } from '../sources/http-client';
import type { ModuleData, ModuleId } from './module-data';

export interface SyncDeps {
  readonly cache: CacheStore;
  readonly now: () => Date;
  readonly logger: Logger;
}

/**
 * Runs one fetch and records the outcome. On failure the previous data stays untouched (F12 R-8)
 * and the failure streak grows. Logs exactly one line per sync, never the payload (NFR-5).
 */
export async function syncModule<K extends ModuleId>(
  id: K,
  fetch: () => Promise<FetchResult<ModuleData[K]>>,
  deps: SyncDeps,
): Promise<CacheEntry<ModuleData[K]>> {
  const startedAt = deps.now();
  const result = await fetch();
  const finishedAt = deps.now();
  const latencyMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());
  const previous = deps.cache.get(id);
  const finishedIso = finishedAt.toISOString();

  const entry: CacheEntry<ModuleData[K]> = result.ok
    ? {
        data: result.value,
        fetched_at: finishedIso,
        last_attempt_at: finishedIso,
        consecutive_failures: 0,
        first_failure_at: null,
        last_error_kind: null,
        last_latency_ms: latencyMs,
      }
    : {
        ...previous,
        last_attempt_at: finishedIso,
        consecutive_failures: previous.consecutive_failures + 1,
        first_failure_at: previous.first_failure_at ?? finishedIso,
        last_error_kind: result.error.kind,
        last_latency_ms: latencyMs,
      };
  deps.cache.set(id, entry);

  const line = {
    module: id,
    ok: result.ok,
    latency_ms: latencyMs,
    error_kind: result.ok ? null : result.error.kind,
  };
  if (result.ok) deps.logger.info(line, 'sync');
  else deps.logger.warn(line, 'sync');
  return entry;
}
