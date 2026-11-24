import { describe, expect, it } from 'vitest';
import { calculateBeat, calculateSlideIndex, resolveSlideCount } from '../src/rotation';

describe('F10: Synchronous Rotation Engine', () => {
  it('calculateBeat divides server time by 15 000 ms (F10 R-1)', () => {
    expect(calculateBeat(0)).toBe(0);
    expect(calculateBeat(14_999)).toBe(0);
    expect(calculateBeat(15_000)).toBe(1);
    expect(calculateBeat(30_000)).toBe(2);
    expect(calculateBeat(45_500)).toBe(3);
  });

  it('AC-F10-1: table test of slide index for beats 0..17 with n = 3, 2, 9', () => {
    const expectedN3 = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2];
    const expectedN2 = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
    const expectedN9 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8];

    for (let beat = 0; beat < 18; beat++) {
      expect(calculateSlideIndex(beat, 3)).toBe(expectedN3[beat]);
      expect(calculateSlideIndex(beat, 2)).toBe(expectedN2[beat]);
      expect(calculateSlideIndex(beat, 9)).toBe(expectedN9[beat]);
    }
  });

  it('handles edge case n <= 1 as static 0 (F10 R-5)', () => {
    expect(calculateSlideIndex(5, 1)).toBe(0);
    expect(calculateSlideIndex(5, 0)).toBe(0);
    expect(calculateSlideIndex(5, -1)).toBe(0);
  });

  it('AC-F10-2: n transition 3 → 2 is applied exactly at first beat with beat % 2 === 0', () => {
    // Current n = 3. Target n = 2.
    // At beat 1: 1 % 2 !== 0 => transition held, retains 3
    expect(resolveSlideCount(3, 2, 1)).toBe(3);

    // At beat 2: 2 % 2 === 0 => transition applied, becomes 2
    expect(resolveSlideCount(3, 2, 2)).toBe(2);

    // At beat 3: 3 % 2 !== 0 => if not applied yet, still held
    expect(resolveSlideCount(3, 2, 3)).toBe(3);

    // At beat 4: 4 % 2 === 0 => applied
    expect(resolveSlideCount(3, 2, 4)).toBe(2);
  });

  it('resolveSlideCount keeps current count if target count equals current', () => {
    expect(resolveSlideCount(3, 3, 1)).toBe(3);
  });

  it('resolveSlideCount immediately accepts target if current count was 0', () => {
    expect(resolveSlideCount(0, 3, 1)).toBe(3);
  });
});
