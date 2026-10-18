/** Failures in a row before the delay starts to grow (F12 R-6). */
export const FAILURES_BEFORE_BACKOFF = 3;

/**
 * Delay before the next attempt (F12 R-6): the normal interval, and after 3 failures in a row
 * × 2, × 4, … capped at `maxBackoffS`. Never shorter than the normal interval.
 * @example nextDelayS(3, 60, 120) → 120; nextDelayS(5, 60, 120) → 120; nextDelayS(0, 60, 120) → 60
 */
export function nextDelayS(
  consecutiveFailures: number,
  intervalS: number,
  maxBackoffS: number,
): number {
  if (consecutiveFailures < FAILURES_BEFORE_BACKOFF) return intervalS;
  const multiplier = 2 ** (consecutiveFailures - FAILURES_BEFORE_BACKOFF + 1);
  return Math.max(intervalS, Math.min(intervalS * multiplier, maxBackoffS));
}
