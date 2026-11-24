import type { ModuleEnvelope, SidPopulation } from '@lobby/contract';
import { formatWibDateId, formatWibTime } from '@lobby/core';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface PopulationCardProps {
  readonly module: ModuleEnvelope<SidPopulation>;
}

export function PopulationCard({ module }: PopulationCardProps) {
  const { state, data, fetched_at } = module;

  if (state === 'loading') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>👥</span>
            <h2 className={styles.cardTitle}>{copy.population.cardTitle}</h2>
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
            <span className={styles.cardIcon}>👥</span>
            <h2 className={styles.cardTitle}>{copy.population.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.population.unavailable}</div>
        </div>
      </div>
    );
  }

  // F07 R-1: If published is false, display placeholder without rotating
  if (!data.published) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>👥</span>
            <h2 className={styles.cardTitle}>{copy.population.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.population.unregistered}</div>
        </div>
      </div>
    );
  }

  const { population, as_of } = data;
  const asOfText = as_of
    ? copy.population.asOf(formatWibDateId(new Date(as_of)))
    : fetched_at
      ? copy.population.asOf(formatWibDateId(new Date(fetched_at)))
      : '';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>👥</span>
          <h2 className={styles.cardTitle}>{copy.population.cardTitle}</h2>
        </div>
        <span className={styles.cardHeaderMeta}>
          {state === 'stale' && fetched_at
            ? copy.common.perHour(formatWibTime(new Date(fetched_at)))
            : asOfText}
        </span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.popGrid}>
          <div className={styles.popItem}>
            <div className={styles.popItemValue}>{population.total.toLocaleString('id-ID')}</div>
            <div className={styles.popItemLabel}>{copy.population.totalCitizens}</div>
          </div>
          <div className={styles.popItem}>
            <div className={styles.popItemValue}>
              {population.households.toLocaleString('id-ID')}
            </div>
            <div className={styles.popItemLabel}>{copy.population.households}</div>
          </div>
          <div className={styles.popItem}>
            <div className={styles.popItemValue}>{population.male.toLocaleString('id-ID')}</div>
            <div className={styles.popItemLabel}>{copy.population.male}</div>
          </div>
          <div className={styles.popItem}>
            <div className={styles.popItemValue}>{population.female.toLocaleString('id-ID')}</div>
            <div className={styles.popItemLabel}>{copy.population.female}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
