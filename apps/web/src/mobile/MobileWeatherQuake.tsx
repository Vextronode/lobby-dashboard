import type { ModuleEnvelope, Quake, WeatherDay } from '@lobby/contract';
import { formatWibTime } from '@lobby/core';
import styles from '../design/mobile.module.css';
import { copy } from '../shared/copy/id';

export interface MobileWeatherQuakeProps {
  readonly weatherModule: ModuleEnvelope<readonly WeatherDay[]>;
  readonly quakeModule: ModuleEnvelope<Quake | null>;
  readonly serverTimeMs?: number | undefined;
}

function WeatherIconSvg({ icon }: { readonly icon: string }) {
  if (icon === 'sun') {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#eab308"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    );
  }
  if (icon === 'rain' || icon === 'rain-heavy' || icon === 'drizzle') {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <line x1="8" y1="19" x2="8" y2="21" />
        <line x1="12" y1="19" x2="12" y2="21" />
        <line x1="16" y1="19" x2="16" y2="21" />
      </svg>
    );
  }
  if (icon === 'storm') {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
        <polyline points="13 11 9 17 15 17 11 23" />
      </svg>
    );
  }
  // Default cloud / sun-cloud / fog
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function MobileWeatherQuake({
  weatherModule,
  quakeModule,
  serverTimeMs,
}: MobileWeatherQuakeProps) {
  const days = weatherModule.data ?? [];
  const isWeatherOk = weatherModule.state === 'ok' && days.length > 0;
  const dayLabels = [copy.weather.today, copy.weather.tomorrow, copy.weather.dayAfter];

  const quake = quakeModule.data;
  const now =
    serverTimeMs ?? (quakeModule.fetched_at ? new Date(quakeModule.fetched_at).getTime() : 0);
  const isQuakeOlderThan24h =
    quake?.updated_at && now > 0
      ? now - new Date(quake.updated_at).getTime() > TWENTY_FOUR_HOURS_MS
      : false;

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{copy.mobile.weatherQuakeTitle}</h2>
        <span className={styles.cardSubtitle}>Pesisir Pangandaran</span>
      </div>

      {/* Weather 3 Days */}
      {isWeatherOk ? (
        <div className={styles.weatherGrid}>
          {days.slice(0, 3).map((day) => {
            const label = dayLabels[day.day_offset] ?? day.date;
            return (
              <div key={day.date} className={styles.weatherCol}>
                <span className={styles.weatherDayLabel}>{label}</span>
                <div className={styles.weatherIconWrapper}>
                  <WeatherIconSvg icon={day.icon} />
                </div>
                <span className={styles.weatherTemp}>
                  {copy.weather.maxTemp(day.temperature_max_c)}
                </span>
                <span className={styles.weatherRain}>
                  {copy.weather.rainProb(day.rain_probability_pct)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.cardSubtitle}>{copy.weather.staleOrUnavailable}</p>
      )}

      <div className={styles.quakeDivider} />

      {/* Quake Pangandaran */}
      <div className={styles.quakeBox}>
        {quakeModule.state === 'unavailable' || (!quake && quakeModule.state !== 'ok') ? (
          <p className={styles.cardSubtitle}>{copy.quakePangandaran.unavailable}</p>
        ) : quake === null ? (
          <p className={styles.cardSubtitle}>{copy.quakePangandaran.noImpact}</p>
        ) : (
          <div className={isQuakeOlderThan24h ? styles.quakeMuted : undefined}>
            <div className={styles.quakeHeaderRow}>
              <span className={styles.quakeMagnitude}>M {quake.magnitude.toFixed(1)}</span>
              <span className={styles.quakeTag}>
                {isQuakeOlderThan24h
                  ? copy.quakePangandaran.olderThan24h
                  : `${formatWibTime(new Date(quake.updated_at))} WIB`}
              </span>
            </div>
            <div className={styles.quakeLocation}>{quake.location}</div>
            <div className={styles.quakeDetailsRow}>
              <span>{copy.quakePangandaran.distance(quake.distance_to_village_km)}</span>
              <span>{copy.quakePangandaran.depth(quake.depth)}</span>
              {quake.potential && <span>{quake.potential}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
