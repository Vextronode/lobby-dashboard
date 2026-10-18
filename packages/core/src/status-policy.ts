import type {
  KnownLevel,
  Level,
  SigapAlert,
  StatusDisplay,
  StatusPolicyState,
  TickerMode,
} from '@lobby/contract';
import { assertNever } from './assert-never';
import { levelLabel, statusCopy } from './copy/id';

const MS_PER_S = 1_000;
const MS_PER_MINUTE = 60_000;

const KNOWN_LEVELS: readonly string[] = ['GREEN', 'YELLOW', 'ORANGE', 'RED'] satisfies KnownLevel[];
const LEVEL_RANK: Readonly<Record<KnownLevel, number>> = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };

/** SIGAP's fallback alert id: GREEN reported when SIGAP does not know (K-N1). */
export const SIGAP_BASELINE_SAFE_ID = 'baseline-safe';

export interface StatusPolicyConfig {
  /** Data older than this is stale (F01 R-4: 3 × 60 s). */
  readonly staleAfterS: number;
  /** How long a level ≥ ORANGE (and Awas) is held without fresh data (F01 R-5: 24 h). */
  readonly holdMaxAgeS: number;
  /** Calm syncs needed to leave Awas (F02 R-2). */
  readonly exitAfterSyncs: number;
  /** Lifetime of the "Awas dicabut" notice (F02 R-4). */
  readonly revokedNoticeMinutes: number;
}

export type StatusEvent =
  | { readonly kind: 'sync_ok'; readonly alert: SigapAlert | null }
  | { readonly kind: 'sync_failed' }
  | { readonly kind: 'read' };

export interface StatusInput {
  readonly event: StatusEvent;
  /** Last SUCCESSFUL sync, including this event when it is `sync_ok` (F12 R-1). */
  readonly fetchedAt: Date | null;
}

export interface StatusEvaluation {
  readonly display: StatusDisplay;
  readonly nextState: StatusPolicyState;
}

export const INITIAL_STATUS_POLICY_STATE: StatusPolicyState = {
  last_raw: null,
  last_known: null,
  awas: null,
  calm_syncs: 0,
  notice: null,
};

/**
 * Raw level of a SIGAP alert (F01 R-2): UNKNOWN for SIGAP's fallback (by `basis` or by id, K-N1),
 * for levels outside GREEN/YELLOW/ORANGE/RED, and for an empty answer.
 */
export function rawLevelOf(alert: SigapAlert | null): Level {
  if (alert === null) return 'UNKNOWN';
  if (alert.basis === 'fallback' || alert.id === SIGAP_BASELINE_SAFE_ID) return 'UNKNOWN';
  return isKnownLevel(alert.level) ? alert.level : 'UNKNOWN';
}

/** Running text mode for a display level (F03 R-1). */
export function tickerModeFor(level: Level): TickerMode {
  switch (level) {
    case 'ORANGE':
    case 'RED':
      return 'override';
    case 'YELLOW':
      return 'priority';
    case 'GREEN':
    case 'UNKNOWN':
      return 'normal';
    default:
      return assertNever(level);
  }
}

/**
 * Status policy (F01 R-2 to R-8, F02 R-1 to R-4, F03 R-1).
 *
 * `sync_ok` / `sync_failed` record a sync outcome; `read` only re-evaluates freshness against `now`.
 * The result is the display for clients plus the state to keep (also after a `read`, because stale
 * data resets the Awas exit count, F02 R-3). Inputs are never mutated.
 *
 * @example
 * // ORANGE synced at 10.00, SIGAP unreachable since: still ORANGE, held (F01 R-5).
 * evaluateStatus(state, { event: { kind: 'read' }, fetchedAt: tenOClock }, tenTen, config)
 *   .display // { level: 'ORANGE', stale_hold: true, … }
 */
export function evaluateStatus(
  prev: StatusPolicyState,
  input: StatusInput,
  now: Date,
  config: StatusPolicyConfig,
): StatusEvaluation {
  const recorded = recordEvent(prev, input.event, now);
  const isStale =
    input.fetchedAt === null ||
    now.getTime() - input.fetchedAt.getTime() > config.staleAfterS * MS_PER_S;
  const rawLevel = recorded.last_raw?.level ?? 'UNKNOWN';
  const isUncertain = isStale || rawLevel === 'UNKNOWN';

  const resolved = resolveLevel(recorded, isUncertain, now, config);
  const next = applyAwas(recorded, input.event, resolved.level, isUncertain, now, config);
  const notice =
    next.notice !== null && Date.parse(next.notice.until) > now.getTime() ? next.notice : null;
  const nextState: StatusPolicyState = { ...next, notice };

  // While Awas is active the display stays RED until the exit count is reached (F02 R-2).
  const display: StatusDisplay =
    nextState.awas === null
      ? {
          level: resolved.level,
          source_level: recorded.last_raw?.level ?? null,
          reason: resolved.reason,
          alert_created_at: resolved.alertCreatedAt,
          stale_hold: isUncertain && resolved.level !== 'UNKNOWN',
          awas: false,
          ticker_mode: tickerModeFor(resolved.level),
          notice,
          last_updated_at: input.fetchedAt?.toISOString() ?? null,
        }
      : {
          level: 'RED',
          source_level: recorded.last_raw?.level ?? null,
          reason: nextState.awas.reason,
          alert_created_at: nextState.awas.alert_created_at,
          stale_hold: isUncertain,
          awas: true,
          ticker_mode: tickerModeFor('RED'),
          notice,
          last_updated_at: input.fetchedAt?.toISOString() ?? null,
        };

  return { display, nextState };
}

function isKnownLevel(level: string): level is KnownLevel {
  return KNOWN_LEVELS.includes(level);
}

/** F01 R-8: SIGAP description unless the alert expired; otherwise a default text. */
function reasonFor(alert: SigapAlert | null, rawLevel: Level): string {
  const description = alert?.description?.trim();
  if (alert !== null && alert.expired !== true && description !== undefined && description !== '') {
    return description;
  }
  switch (rawLevel) {
    case 'GREEN':
      return statusCopy.noActiveAlert;
    case 'UNKNOWN':
      return statusCopy.unknown;
    case 'YELLOW':
    case 'ORANGE':
    case 'RED':
      // Not covered by F01 R-8; the level label is the most neutral fallback.
      return levelLabel[rawLevel];
    default:
      return assertNever(rawLevel);
  }
}

function recordEvent(prev: StatusPolicyState, event: StatusEvent, now: Date): StatusPolicyState {
  switch (event.kind) {
    case 'read':
      return prev;
    case 'sync_failed':
      // A failed sync breaks the "consecutive" calm syncs (F02 R-2); conservative choice.
      return { ...prev, calm_syncs: 0 };
    case 'sync_ok': {
      const level = rawLevelOf(event.alert);
      const reason = reasonFor(event.alert, level);
      const alertCreatedAt =
        event.alert === null || level === 'UNKNOWN'
          ? null
          : new Date(event.alert.createdAt).toISOString();
      const lastRaw = { level, reason, alert_created_at: alertCreatedAt };
      return {
        ...prev,
        last_raw: lastRaw,
        // F01 R-3: remember the last level SIGAP actually knew.
        last_known:
          level === 'UNKNOWN'
            ? prev.last_known
            : { ...lastRaw, level, observed_at: now.toISOString() },
      };
    }
    default:
      return assertNever(event);
  }
}

interface ResolvedLevel {
  readonly level: Level;
  readonly reason: string;
  readonly alertCreatedAt: string | null;
}

/** F01 R-5 to R-7. */
function resolveLevel(
  state: StatusPolicyState,
  isUncertain: boolean,
  now: Date,
  config: StatusPolicyConfig,
): ResolvedLevel {
  if (!isUncertain && state.last_raw !== null) {
    return {
      level: state.last_raw.level,
      reason: state.last_raw.reason,
      alertCreatedAt: state.last_raw.alert_created_at,
    };
  }
  const known = state.last_known;
  const canHold =
    known !== null &&
    LEVEL_RANK[known.level] >= LEVEL_RANK.ORANGE &&
    now.getTime() - Date.parse(known.observed_at) <= config.holdMaxAgeS * MS_PER_S;
  if (canHold) {
    return { level: known.level, reason: known.reason, alertCreatedAt: known.alert_created_at };
  }
  return { level: 'UNKNOWN', reason: statusCopy.unknown, alertCreatedAt: null };
}

/** F02 R-1 to R-4. */
function applyAwas(
  state: StatusPolicyState,
  event: StatusEvent,
  level: Level,
  isUncertain: boolean,
  now: Date,
  config: StatusPolicyConfig,
): StatusPolicyState {
  if (state.awas === null) {
    if (level !== 'RED') return state;
    // R-1: enter as soon as the display level is RED.
    return {
      ...state,
      awas: {
        reason: state.last_known?.reason ?? statusCopy.unknown,
        alert_created_at: state.last_known?.alert_created_at ?? null,
        last_red_at: state.last_known?.observed_at ?? now.toISOString(),
      },
      calm_syncs: 0,
    };
  }

  const rawLevel = state.last_raw?.level ?? 'UNKNOWN';
  if (event.kind === 'sync_ok' && rawLevel === 'RED') {
    const lastRed = state.last_known?.observed_at ?? now.toISOString();
    return {
      ...state,
      awas: {
        reason: state.last_raw?.reason ?? state.awas.reason,
        alert_created_at: state.last_raw?.alert_created_at ?? null,
        last_red_at: lastRed,
      },
      calm_syncs: 0,
    };
  }

  // Held at most as long as any other level ≥ ORANGE (F02 R-3, F01 R-5). Past that the level is
  // unknown, not revoked by SIGAP, so Awas ends without the revoked notice.
  const heldMs = now.getTime() - Date.parse(state.awas.last_red_at);
  if (heldMs > config.holdMaxAgeS * MS_PER_S) {
    return { ...state, awas: null, calm_syncs: 0 };
  }

  // R-3: stale data or an UNKNOWN level resets the exit count.
  if (isUncertain) return { ...state, calm_syncs: 0 };
  if (event.kind !== 'sync_ok') return state;

  const calmSyncs = state.calm_syncs + 1;
  if (calmSyncs < config.exitAfterSyncs) return { ...state, calm_syncs: calmSyncs };

  // R-2 reached: leave Awas, R-4: announce the new level for a while.
  return {
    ...state,
    awas: null,
    calm_syncs: 0,
    notice: {
      text: statusCopy.awasRevoked(levelLabel[level]),
      until: new Date(now.getTime() + config.revokedNoticeMinutes * MS_PER_MINUTE).toISOString(),
    },
  };
}
