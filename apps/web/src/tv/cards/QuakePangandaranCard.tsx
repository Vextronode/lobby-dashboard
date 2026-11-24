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
  const { state, data, fetched_at } = module;

  if (state === 'loading') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🌋</span>
            <h2 className={styles.cardTitle}>{copy.quakePangandaran.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.common.loading}</div>
        </div>
      </div>
    );
  }

  if (state === 'unavailable' || (!data && state !== 'ok')) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🌋</span>
            <h2 className={styles.cardTitle}>{copy.quakePangandaran.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.quakePangandaran.unavailable}</div>
        </div>
      </div>
    );
  }

  // F05 R-6: data === null in 'ok' state means no relevant quakes
  if (data === null) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🌋</span>
            <h2 className={styles.cardTitle}>{copy.quakePangandaran.cardTitle}</h2>
          </div>
          {state === 'stale' && fetched_at && (
            <span className={styles.cardHeaderMeta}>
              {copy.common.perHour(formatWibTime(new Date(fetched_at)))}
            </span>
          )}
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.quakePangandaran.noImpact}</div>
        </div>
      </div>
    );
  }

  const eventTime = new Date(data.updated_at);
  const now = serverTimeMs ?? (fetched_at ? new Date(fetched_at).getTime() : 0);
  const isOlderThan24h = now > 0 && now - eventTime.getTime() > TWENTY_FOUR_HOURS_MS;
  const timeText = formatWibDateTimeId(eventTime);
  const cardClasses = [styles.card, isOlderThan24h ? styles.quakeMuted : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>🌋</span>
          <h2 className={styles.cardTitle}>{copy.quakePangandaran.cardTitle}</h2>
        </div>
        {state === 'stale' && fetched_at && (
          <span className={styles.cardHeaderMeta}>
            {copy.common.perHour(formatWibTime(new Date(fetched_at)))}
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.quakeRow}>
          <div className={styles.quakeMagnitude}>M {data.magnitude.toFixed(1)}</div>
          <div className={styles.quakeDetails}>
            <div className={styles.quakeLocation}>{data.location}</div>
            <div className={styles.quakeMeta}>
              {copy.quakePangandaran.distance(data.distance_to_village_km)} ·{' '}
              {copy.quakePangandaran.depth(data.depth)}
            </div>
            <div className={styles.quakeMeta}>
              {isOlderThan24h ? copy.quakePangandaran.olderThan24h : timeText}
            </div>
            {data.potential && <div className={styles.quakeMeta}>{data.potential}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
