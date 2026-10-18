import type { SigapWeatherDay, WeatherDay, WeatherIcon } from '@lobby/contract';
import { daysBetween, wibDateString } from './time';

/** Today, tomorrow, the day after (F04 R-1, R-2). */
const FORECAST_DAYS = 3;

/** Exact `condition → icon` map with a fallback for unknown values (F04 R-3, K-N14). */
export interface WeatherIconMap {
  readonly _default: WeatherIcon;
  readonly [condition: string]: WeatherIcon;
}

/** Icon for a SIGAP condition; unknown conditions get `_default` (F04 R-3). */
export function weatherIconFor(condition: string, icons: WeatherIconMap): WeatherIcon {
  const isMapped = condition !== '_default' && Object.hasOwn(icons, condition);
  return isMapped ? (icons[condition] ?? icons._default) : icons._default;
}

function isDayOffset(offset: number): offset is WeatherDay['day_offset'] {
  return offset === 0 || offset === 1 || offset === 2;
}

/**
 * Forecast days to show (F04 R-1 to R-4): items dated today (WIB) or later, the first three, labelled
 * by their distance from today's WIB date (SIGAP's own label is ignored, R-2).
 * @example at 2026-11-02 23.30 WIB, a forecast starting 2026-11-01 → days 2, 3, 4 Nov with offsets 0, 1, 2
 */
export function selectForecastDays(
  days: readonly SigapWeatherDay[],
  now: Date,
  icons: WeatherIconMap,
): WeatherDay[] {
  const today = wibDateString(now);
  return [...days]
    .filter((day) => day.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, FORECAST_DAYS)
    .flatMap((day): WeatherDay[] => {
      const offset = daysBetween(today, day.date);
      // A gap in SIGAP's dates must not produce a fourth label.
      if (!isDayOffset(offset)) return [];
      return [
        {
          date: day.date,
          day_offset: offset,
          condition: day.condition,
          icon: weatherIconFor(day.condition, icons),
          temperature_max_c: day.temperature,
          rain_probability_pct: day.rainProbability,
        },
      ];
    });
}
