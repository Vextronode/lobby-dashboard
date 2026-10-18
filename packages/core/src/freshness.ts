import type { ModuleState } from '@lobby/contract';

const MS_PER_S = 1_000;

export interface FreshnessInput {
  /** Last SUCCESSFUL sync (F12 R-1). */
  readonly fetchedAt: Date | null;
  /** Last completed attempt, successful or not. */
  readonly lastAttemptAt: Date | null;
}

export interface FreshnessPolicy {
  readonly intervalS: number;
  /** Stale after `staleFactor × intervalS` (F12 R-2). */
  readonly staleFactor: number;
  readonly maxAgeS: number;
}

export interface Freshness {
  readonly state: ModuleState;
  readonly ageS: number | null;
}

/**
 * Module state, computed when data is read, never stored (F12 R-2):
 * `loading` before any attempt, `ok` up to `staleFactor × interval`, `stale` up to the max age,
 * `unavailable` when attempts never succeeded or data is older than the max age.
 * @example moduleFreshness({ fetchedAt: t, lastAttemptAt: t }, t + 181 s, { intervalS: 60, staleFactor: 3, maxAgeS: 86400 })
 *   // → { state: 'stale', ageS: 181 }
 */
export function moduleFreshness(
  input: FreshnessInput,
  now: Date,
  policy: FreshnessPolicy,
): Freshness {
  if (input.fetchedAt === null) {
    return { state: input.lastAttemptAt === null ? 'loading' : 'unavailable', ageS: null };
  }
  const ageS = Math.max(0, Math.floor((now.getTime() - input.fetchedAt.getTime()) / MS_PER_S));
  if (ageS > policy.maxAgeS) return { state: 'unavailable', ageS };
  if (ageS > policy.staleFactor * policy.intervalS) return { state: 'stale', ageS };
  return { state: 'ok', ageS };
}
