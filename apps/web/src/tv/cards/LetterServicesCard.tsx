import type { ModuleEnvelope, SidServices } from '@lobby/contract';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';
import { useGlobalBeat } from '../../shared/hooks/useGlobalBeat';

export interface LetterServicesCardProps {
  readonly module: ModuleEnvelope<SidServices>;
  readonly serverTimeOffsetMs?: number;
}

export function LetterServicesCard({ module, serverTimeOffsetMs = 0 }: LetterServicesCardProps) {
  const { state, data } = module;

  // F08: 2 slides if top_types > 0; 1 slide if top_types empty or unavailable
  const hasTopTypes = Boolean(data && data.letters.top_types.length > 0);
  const slideCount = state === 'ok' && hasTopTypes ? 2 : 1;

  const { slideIndex } = useGlobalBeat(slideCount, serverTimeOffsetMs);

  if (state === 'loading') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>✉️</span>
            <h2 className={styles.cardTitle}>{copy.letters.cardTitle}</h2>
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
            <span className={styles.cardIcon}>✉️</span>
            <h2 className={styles.cardTitle}>{copy.letters.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.letters.unavailable}</div>
        </div>
      </div>
    );
  }

  const { letters } = data;

  // Slide 1 (if available): Top letter types
  if (slideIndex === 1 && hasTopTypes) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>✉️</span>
            <h2 className={styles.cardTitle}>{copy.letters.cardTitle}</h2>
          </div>
          <span className={styles.cardHeaderMeta}>{copy.letters.topTypesTitle}</span>
        </div>
        <div className={styles.cardBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
            {letters.top_types.slice(0, 5).map((type) => (
              <div key={type.code} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{type.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {type.count.toString()} surat
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Slide 0: KPI & Trend
  const maxWeekly = Math.max(...letters.weekly.map((w) => Math.max(w.submitted, w.completed)), 1);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>✉️</span>
          <h2 className={styles.cardTitle}>{copy.letters.cardTitle}</h2>
        </div>
        <span className={styles.cardHeaderMeta}>{letters.month}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.kpiRow}>
          <div className={styles.kpiBox}>
            <div className={styles.kpiValue}>{letters.submitted}</div>
            <div className={styles.kpiLabel}>{copy.letters.kpiSubmitted}</div>
          </div>
          <div className={styles.kpiBox}>
            <div className={styles.kpiValue}>{letters.completed}</div>
            <div className={styles.kpiLabel}>{copy.letters.kpiCompleted}</div>
          </div>
          <div className={styles.kpiBox}>
            <div className={styles.kpiValue}>{letters.in_process}</div>
            <div className={styles.kpiLabel}>{copy.letters.kpiInProcess}</div>
          </div>
        </div>

        <div
          style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}
        >
          {copy.letters.trendTitle}
        </div>
        <div className={styles.trendChart}>
          {letters.weekly.map((w, idx) => {
            const heightPct = Math.round((w.completed / maxWeekly) * 100);
            return (
              <div
                key={w.week_start || idx.toString()}
                className={styles.trendBar}
                style={{ height: `${Math.max(4, heightPct).toString()}%` }}
                title={`${w.week_start}: ${w.completed.toString()} selesai`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
