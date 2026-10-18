/** All display dates and times are WIB (default B24). */
export const WIB_TIME_ZONE = 'Asia/Jakarta';

const MS_PER_DAY = 86_400_000;
const MINUTES_PER_HOUR = 60;

const wibDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WIB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const wibClockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: WIB_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  hourCycle: 'h23',
});

const ISO_WEEKDAY: Readonly<Record<string, number>> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** WIB calendar date of an instant, `YYYY-MM-DD`. */
export function wibDateString(instant: Date): string {
  return wibDateFormatter.format(instant);
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD` calendar dates. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

interface WibClock {
  /** ISO weekday, 1 = Monday … 7 = Sunday. */
  readonly weekday: number;
  readonly hour: number;
  readonly minute: number;
}

/** Weekday and wall-clock time of an instant in WIB. */
export function wibClock(instant: Date): WibClock {
  const parts = wibClockFormatter.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  const weekday = ISO_WEEKDAY[part('weekday')];
  if (weekday === undefined) throw new Error('Unexpected weekday from Intl.DateTimeFormat');
  return { weekday, hour: Number(part('hour')), minute: Number(part('minute')) };
}

/** `HH.MM` in WIB, as used on screen and in messages, e.g. "14.05". */
export function formatWibTime(instant: Date): string {
  const { hour, minute } = wibClock(instant);
  return `${String(hour).padStart(2, '0')}.${String(minute).padStart(2, '0')}`;
}

/** Minutes since WIB midnight. */
export function wibMinutesOfDay(instant: Date): number {
  const { hour, minute } = wibClock(instant);
  return hour * MINUTES_PER_HOUR + minute;
}
