import {
  BEAT_INTERVAL_MS,
  calculateBeat,
  calculateSlideIndex,
  resolveSlideCount,
} from '@lobby/core';
import { useEffect, useState } from 'react';

/**
 * Hook to synchronize slide rotation with server time (F10).
 * Calculates current beat = floor(serverTimeMs / 15_000 ms) and current slide.
 * Applies slide count transition hysteresis (F10 R-4).
 */
export function useGlobalBeat(targetSlideCount: number, serverTimeOffsetMs = 0) {
  const [beat, setBeat] = useState<number>(() => calculateBeat(Date.now() + serverTimeOffsetMs));
  const [activeSlideCount, setActiveSlideCount] = useState<number>(targetSlideCount);

  useEffect(() => {
    const update = () => {
      const now = Date.now() + serverTimeOffsetMs;
      const currentBeat = calculateBeat(now);
      setBeat(currentBeat);
      setActiveSlideCount((prev) => resolveSlideCount(prev, targetSlideCount, currentBeat));
    };

    update();

    const now = Date.now() + serverTimeOffsetMs;
    const msUntilNextBeat = BEAT_INTERVAL_MS - (now % BEAT_INTERVAL_MS);

    let intervalId: NodeJS.Timeout | null = null;
    const timeoutId = setTimeout(() => {
      update();
      intervalId = setInterval(update, BEAT_INTERVAL_MS);
    }, msUntilNextBeat);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [targetSlideCount, serverTimeOffsetMs]);

  const slideIndex = calculateSlideIndex(beat, activeSlideCount);

  return {
    beat,
    slideIndex,
    activeSlideCount,
  };
}
