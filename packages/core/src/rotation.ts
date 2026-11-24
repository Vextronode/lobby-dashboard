/**
 * 15-second global synchronized rotation beat engine (F10).
 * All rotating cards advance slides synchronously based on corrected server time.
 */

export const BEAT_INTERVAL_MS = 15_000;

/**
 * Calculates current global beat number from server time in milliseconds.
 * F10 R-1: ketukan = floor(jam_server_terkoreksi / 15.000 ms).
 */
export function calculateBeat(serverTimeMs: number): number {
  return Math.floor(serverTimeMs / BEAT_INTERVAL_MS);
}

/**
 * Calculates active slide index (0-based) for a given beat and slide count n.
 * F10 R-2: slide yang tampil = ketukan mod n.
 */
export function calculateSlideIndex(beat: number, totalSlides: number): number {
  if (totalSlides <= 1) return 0;
  return ((beat % totalSlides) + totalSlides) % totalSlides;
}

/**
 * Resolves slide count transitions (F10 R-4).
 * If new data changes totalSlides (n_old -> n_new), the transition is held
 * and only applied at the first beat where (beat % n_new === 0).
 */
export function resolveSlideCount(
  currentSlideCount: number,
  targetSlideCount: number,
  beat: number,
): number {
  if (targetSlideCount === currentSlideCount || targetSlideCount <= 0) {
    return currentSlideCount;
  }
  if (currentSlideCount <= 0) {
    return targetSlideCount;
  }
  if (beat % targetSlideCount === 0) {
    return targetSlideCount;
  }
  return currentSlideCount;
}
