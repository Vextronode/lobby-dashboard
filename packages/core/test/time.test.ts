import { describe, expect, it } from 'vitest';
import { daysBetween, formatWibTime, wibClock, wibDateString, wibMinutesOfDay } from '../src/time';

describe('WIB time helpers', () => {
  it.each([
    ['2026-11-02T16:59:59Z', '2026-11-02'], // 23.59 WIB
    ['2026-11-02T17:00:00Z', '2026-11-03'], // 00.00 WIB next day
    ['2026-10-31T17:30:00Z', '2026-11-01'], // month boundary
    ['2026-12-31T17:00:00Z', '2027-01-01'], // year boundary
  ])('wibDateString(%s) = %s', (instant, date) => {
    expect(wibDateString(new Date(instant))).toBe(date);
  });

  it.each([
    ['2026-11-02', '2026-11-02', 0],
    ['2026-11-02', '2026-11-04', 2],
    ['2026-10-31', '2026-11-01', 1],
    ['2026-11-03', '2026-11-02', -1],
  ])('daysBetween(%s, %s) = %i', (from, to, days) => {
    expect(daysBetween(from, to)).toBe(days);
  });

  it.each([
    ['2026-10-16T07:05:00Z', '14.05'], // F05 AC-F05-3 example
    ['2026-11-02T17:00:00Z', '00.00'],
    ['2026-11-02T16:59:00Z', '23.59'],
  ])('formatWibTime(%s) = %s', (instant, text) => {
    expect(formatWibTime(new Date(instant))).toBe(text);
  });

  it.each([
    ['2026-11-02T03:00:00Z', 1, 600], // Monday 10.00 WIB
    ['2026-11-01T17:30:00Z', 1, 30], // Sunday 17.30 UTC = Monday 00.30 WIB
    ['2026-11-08T16:59:00Z', 7, 1439], // Sunday 23.59 WIB
  ])('wibClock(%s) → weekday %i, minute of day %i', (instant, weekday, minutes) => {
    expect(wibClock(new Date(instant)).weekday).toBe(weekday);
    expect(wibMinutesOfDay(new Date(instant))).toBe(minutes);
  });
});
