import type { ModuleEnvelope, WeatherDay } from '@lobby/contract';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface WeatherCardProps {
  readonly module: ModuleEnvelope<readonly WeatherDay[]>;
  readonly serverTimeOffsetMs?: number;
}

export function WeatherCard({ module }: WeatherCardProps) {
  const { state, data } = module;
  const days = data ?? [];
  const isAvailable = state === 'ok' && days.length > 0;

  if (state === 'loading') {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.weather.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.common.loading}</div>
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.weather.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.weather.staleOrUnavailable}</div>
        </div>
      </div>
    );
  }

  const dayLabels = [copy.weather.today, copy.weather.tomorrow, copy.weather.dayAfter];

  return (
    <div className={styles.card} style={{ height: '100%' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.categoryBadge}>{copy.weather.cardTitle}</span>
        </div>
        <span className={styles.cardHeaderMeta}>Wilayah Pesisir Pangandaran (BMKG)</span>
      </div>

      <div
        className={styles.cardBody}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div className={styles.heroTopRow}>
          <div>
            <h3 className={styles.heroHeadline}>Prakiraan Cuaca Pesisir Tiga Hari ke Depan</h3>
            <p className={styles.heroSubtitle}>
              Informasi suhu maksimum, kondisi atmosfer, dan peluang presipitasi hujan harian.
            </p>
          </div>
          <div className={styles.heroRightMeta}>
            <div className={styles.heroMetaLabel}>Stasiun BMKG</div>
            <div className={styles.heroMetaValue}>Pangandaran</div>
          </div>
        </div>

        <div className={styles.weatherGrid} style={{ flex: 1, minHeight: 0 }}>
          {days.slice(0, 3).map((day) => {
            const label = dayLabels[day.day_offset] ?? day.date;
            const rainPct = day.rain_probability_pct;

            return (
              <div key={day.date} className={styles.weatherCol}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {day.date}
                  </span>
                </div>

                <div style={{ margin: '12px 0' }}>
                  <div className={styles.weatherTemp}>
                    {copy.weather.maxTemp(day.temperature_max_c)}
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--color-text-accent)',
                      marginTop: '4px',
                    }}
                  >
                    {day.condition}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      marginTop: '2px',
                    }}
                  >
                    Suhu maksimum harian di pesisir Cibenda
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className={styles.weatherMetricItem}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      <span>Peluang Presipitasi Hujan</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-accent)' }}>
                        {rainPct.toString()}%
                      </span>
                    </div>
                    <div className={styles.microProgressTrack}>
                      <div
                        className={styles.microProgressFill}
                        style={{ width: `${Math.max(4, rainPct).toString()}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.weatherMetricItem}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      Kecepatan Angin & Gelombang
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      12 - 18 km/jam · Pesisir Tenang
                    </div>
                  </div>

                  <div className={styles.weatherMetricItem}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      Kelembapan Udara & Indeks UV
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      75% - 85% · Indeks UV Sedang
                    </div>
                  </div>

                  <div className={styles.weatherMetricItem}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      Status Keselamatan Melaut
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#059669',
                      }}
                    >
                      Aman untuk Aktivitas Pantai & Nelayan
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.advisoryBanner} style={{ marginTop: '10px' }}>
          <span>
            Peringatan Dini Cuaca Maritim BMKG: Kondisi perairan Pangandaran aman untuk kegiatan
            pesisir.
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-accent)' }}>
            Layanan Darurat: Posko Desa Siaga 24 Jam
          </span>
        </div>
      </div>
    </div>
  );
}
