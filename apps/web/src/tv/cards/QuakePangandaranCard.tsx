import type { ModuleEnvelope, Quake } from '@lobby/contract';
import { formatWibDateTimeId, formatWibTime } from '@lobby/core';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface QuakePangandaranCardProps {
  readonly module: ModuleEnvelope<Quake | null>;
  readonly serverTimeMs?: number;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function QuakePangandaranCard({ module, serverTimeMs }: QuakePangandaranCardProps) {
  const { data, state, fetched_at } = module;

  if (state === 'loading') {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.quakePangandaran.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.loadingPulse} />
        </div>
      </div>
    );
  }

  if (state === 'unavailable' || (!data && state !== 'ok')) {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.quakePangandaran.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <p className={styles.errorText}>{copy.quakePangandaran.unavailable}</p>
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.quakePangandaran.cardTitle}</h2>
          </div>
          {state === 'stale' && fetched_at && (
            <span className={styles.cardHeaderMeta}>
              {copy.common.perHour(formatWibTime(new Date(fetched_at)))}
            </span>
          )}
        </div>
        <div className={styles.cardBody}>
          <p className={styles.cardTextMuted}>{copy.quakePangandaran.noImpact}</p>
        </div>
      </div>
    );
  }

  const eventTime = new Date(data.updated_at);
  const now = serverTimeMs ?? (fetched_at ? new Date(fetched_at).getTime() : 0);
  const isOlderThan24h = now > 0 && now - eventTime.getTime() > TWENTY_FOUR_HOURS_MS;
  const timeText = formatWibDateTimeId(eventTime);

  const cardClasses = [styles.card, state === 'stale' ? styles.cardStale : '']
    .filter(Boolean)
    .join(' ');

  const gaugePercent = Math.min(Math.max(((data.magnitude - 2) / 6) * 100, 2), 98);

  return (
    <div className={cardClasses} style={{ height: '100%' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <h2 className={styles.cardTitle}>{copy.quakePangandaran.cardTitle}</h2>
        </div>
        <span className={styles.categoryBadge}>Sensor BMKG</span>
      </div>

      <div
        className={styles.cardBody}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className={styles.giantMetric}>M {data.magnitude.toFixed(1)}</div>
            {data.potential ? (
              <div className={styles.badgeSuccess}>
                <span>{data.potential}</span>
              </div>
            ) : null}
          </div>

          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginTop: '4px',
            }}
          >
            {data.location}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Pusat gempa terdeteksi oleh stasiun geofisika pesisir selatan Jawa Barat
          </div>
        </div>

        <div style={{ marginTop: '2px', marginBottom: '2px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              marginBottom: '6px',
              fontWeight: 600,
            }}
          >
            <span>Skala Rendah (M 2-3)</span>
            <span>Skala Sedang (M 4-5)</span>
            <span>Skala Kuat (M 6+)</span>
          </div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background:
                'linear-gradient(90deg, #10b981 0%, #3b82f6 35%, #f59e0b 70%, #ef4444 100%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                left: `${gaugePercent.toString()}%`,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '3px solid #475569',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        </div>

        <div className={styles.bentoGrid2x2}>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>Jarak ke Desa</div>
            <div className={styles.metricBoxValue} style={{ fontSize: '18px' }}>
              {data.distance_to_village_km.toString()} km
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Radius pantauan aman
            </div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>Kedalaman Gempa</div>
            <div className={styles.metricBoxValue} style={{ fontSize: '18px' }}>
              {data.depth}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Gempa tektonik dangkal
            </div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>Waktu Kejadian</div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginTop: '4px',
                lineHeight: 1.3,
              }}
            >
              {isOlderThan24h ? copy.quakePangandaran.olderThan24h : timeText}
            </div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>Status Evakuasi</div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#059669',
                marginTop: '4px',
                lineHeight: 1.3,
              }}
            >
              Kondusif & Aman
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Jalur Evakuasi Utama: Lapang Karanganyar & Balai Desa Cibenda.
        </div>
      </div>
    </div>
  );
}
