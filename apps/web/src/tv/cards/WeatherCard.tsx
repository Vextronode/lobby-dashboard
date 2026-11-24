import type { ModuleEnvelope, WeatherDay } from '@lobby/contract';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';
import { useGlobalBeat } from '../../shared/hooks/useGlobalBeat';

export interface WeatherCardProps {
  readonly module: ModuleEnvelope<readonly WeatherDay[]>;
  readonly serverTimeOffsetMs?: number;
}

const WEATHER_ICONS: Readonly<Record<string, string>> = {
  sun: '☀️',
  'sun-cloud': '⛅',
  cloud: '☁️',
  fog: '🌫️',
  drizzle: '🌦️',
  rain: '🌧️',
  'rain-heavy': '⛈️',
  storm: '🌩️',
};

export function WeatherCard({ module, serverTimeOffsetMs = 0 }: WeatherCardProps) {
  const { state, data } = module;
  const days = data ?? [];

  // F04 R-5 / K-A20: 3 slides when ok; 1 slide when stale/unavailable (shows stale message without old data)
  const isAvailable = state === 'ok' && days.length > 0;
  const slideCount = isAvailable ? days.length : 1;

  const { slideIndex } = useGlobalBeat(slideCount, serverTimeOffsetMs);

  if (state === 'loading') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🌤️</span>
            <h2 className={styles.cardTitle}>{copy.weather.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.common.loading}</div>
        </div>
      </div>
    );
  }

  // F04: Stale or unavailable displays "Belum ada informasi terbaru"
  if (!isAvailable) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🌤️</span>
            <h2 className={styles.cardTitle}>{copy.weather.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.weather.staleOrUnavailable}</div>
        </div>
      </div>
    );
  }

  const currentDay = days[slideIndex] ?? days[0];
  if (!currentDay) {
    return null;
  }

  const dayLabels = [copy.weather.today, copy.weather.tomorrow, copy.weather.dayAfter];
  const dayLabel = dayLabels[currentDay.day_offset] ?? currentDay.date;
  const iconSymbol = WEATHER_ICONS[currentDay.icon] ?? '⛅';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>🌤️</span>
          <h2 className={styles.cardTitle}>{copy.weather.cardTitle}</h2>
        </div>
        <span className={styles.cardHeaderMeta}>{dayLabel}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.weatherSlide}>
          <div>
            <div className={styles.weatherDayLabel}>{dayLabel}</div>
            <div className={styles.weatherCondition}>{currentDay.condition}</div>
            <div className={styles.weatherRain}>
              {copy.weather.rainProb(currentDay.rain_probability_pct)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '32px' }}>{iconSymbol}</div>
            <div className={styles.weatherTemp}>
              {copy.weather.maxTemp(currentDay.temperature_max_c)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
