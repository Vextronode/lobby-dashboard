import type { ModuleEnvelope, QuakeList } from '@lobby/contract';
import { formatWibTime } from '@lobby/core';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';
import { useGlobalBeat } from '../../shared/hooks/useGlobalBeat';

export interface QuakeListCardProps {
  readonly module: ModuleEnvelope<QuakeList>;
  readonly serverTimeOffsetMs?: number;
}

const ITEMS_PER_PAGE = 3;

export function QuakeListCard({ module, serverTimeOffsetMs = 0 }: QuakeListCardProps) {
  const { state, data, fetched_at } = module;

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const { slideIndex } = useGlobalBeat(totalPages, serverTimeOffsetMs);

  if (state === 'loading') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🌐</span>
            <h2 className={styles.cardTitle}>{copy.quakeList.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.common.loading}</div>
        </div>
      </div>
    );
  }

  if (state === 'unavailable' || !data) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🌐</span>
            <h2 className={styles.cardTitle}>{copy.quakeList.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.quakeList.unavailable}</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🌐</span>
            <h2 className={styles.cardTitle}>{copy.quakeList.cardTitle}</h2>
          </div>
          {state === 'stale' && fetched_at && (
            <span className={styles.cardHeaderMeta}>
              {copy.common.perHour(formatWibTime(new Date(fetched_at)))}
            </span>
          )}
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.quakeList.empty}</div>
        </div>
      </div>
    );
  }

  const safePageIndex = slideIndex < totalPages ? slideIndex : 0;
  const pageItems = items.slice(
    safePageIndex * ITEMS_PER_PAGE,
    (safePageIndex + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>🌐</span>
          <h2 className={styles.cardTitle}>{copy.quakeList.cardTitle}</h2>
        </div>
        <span className={styles.cardHeaderMeta}>
          {state === 'stale' && fetched_at
            ? copy.common.perHour(formatWibTime(new Date(fetched_at)))
            : totalPages > 1
              ? copy.quakeList.pageIndicator(safePageIndex + 1, totalPages)
              : ''}
        </span>
      </div>
      <div className={styles.cardBody}>
        <table className={styles.quakeTable}>
          <tbody>
            {pageItems.map((quake, idx) => {
              const isJabar = quake.tag === 'Jabar';
              const eventTime = formatWibTime(new Date(quake.updated_at));
              const tagClasses = [styles.quakeTag, isJabar ? styles.quakeTagJabar : '']
                .filter(Boolean)
                .join(' ');
              return (
                <tr key={`${quake.updated_at}-${idx.toString()}`}>
                  <td style={{ width: '56px' }}>
                    <span className={tagClasses}>{quake.tag}</span>
                  </td>
                  <td style={{ width: '45px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    M {quake.magnitude.toFixed(1)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{quake.location}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {quake.distance_to_village_km.toString()} km · {quake.depth}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: 'var(--color-text-secondary)',
                      width: '55px',
                    }}
                  >
                    {eventTime}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
