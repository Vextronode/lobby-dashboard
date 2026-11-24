import type { ModuleEnvelope, SidPopulation } from '@lobby/contract';
import { formatWibDateId } from '@lobby/core';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface PopulationCardProps {
  readonly module: ModuleEnvelope<SidPopulation>;
}

export function PopulationCard({ module }: PopulationCardProps) {
  const { state, data, fetched_at } = module;

  if (state === 'loading') {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
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
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.population.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.population.unavailable}</div>
        </div>
      </div>
    );
  }

  if (!data.published) {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.population.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.population.unregistered}</div>
        </div>
      </div>
    );
  }

  const { population, hamlets, as_of } = data;
  const asOfText = as_of
    ? copy.population.asOf(formatWibDateId(new Date(as_of)))
    : fetched_at
      ? copy.population.asOf(formatWibDateId(new Date(fetched_at)))
      : 'Pembaruan SID';

  const total = Math.max(population.total, 1);
  const malePct = Math.round((population.male / total) * 100);
  const femalePct = 100 - malePct;
  const maxDusun = Math.max(...hamlets.items.map((h) => h.count ?? 0), 1);

  return (
    <div className={styles.card} style={{ height: '100%' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <h2 className={styles.cardTitle}>{copy.population.cardTitle}</h2>
        </div>
        <div className={styles.badgeSuccess}>
          <span>Data Terverifikasi</span>
        </div>
      </div>

      <div
        className={styles.cardBody}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '2px',
            }}
          >
            <div className={styles.giantMetric}>{population.total.toLocaleString('id-ID')}</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
              }}
            >
              {population.households.toLocaleString('id-ID')} {copy.population.households}
            </div>
          </div>
          <div className={styles.metricSubtext}>
            {copy.population.totalCitizens} Desa Cibenda · Rata-rata 3,3 jiwa per keluarga
          </div>

          <div className={styles.splitBarContainer}>
            <div className={styles.splitLabels}>
              <span style={{ color: 'var(--color-text-accent)' }}>
                {copy.population.male}: {population.male.toLocaleString('id-ID')} (
                {malePct.toString()}%)
              </span>
              <span style={{ color: '#db2777' }}>
                {copy.population.female}: {population.female.toLocaleString('id-ID')} (
                {femalePct.toString()}%)
              </span>
            </div>
            <div className={styles.splitBar}>
              <div className={styles.splitBarMale} style={{ width: `${malePct.toString()}%` }} />
              <div
                className={styles.splitBarFemale}
                style={{ width: `${femalePct.toString()}%` }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            margin: '4px 0',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Sebaran Penduduk Berdasarkan Dusun
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hamlets.items.map((h) => {
              const countVal = h.count ?? 0;
              const pct = Math.round((countVal / total) * 100);
              const barWidth = Math.round((countVal / maxDusun) * 100);

              return (
                <div key={h.name} className={styles.dusunItem}>
                  <div className={styles.dusunHeader}>
                    <span>Dusun {h.name}</span>
                    <span>
                      {h.count !== null
                        ? `${h.count.toLocaleString('id-ID')} jiwa (${pct.toString()}%)`
                        : copy.profile.suppressed}
                    </span>
                  </div>
                  <div className={styles.microProgressTrack}>
                    <div
                      className={styles.microProgressFill}
                      style={{ width: `${Math.max(6, barWidth).toString()}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.bentoGrid2x2} style={{ marginTop: '4px' }}>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>{copy.population.households}</div>
            <div className={styles.metricBoxValue} style={{ fontSize: '18px' }}>
              {population.households.toLocaleString('id-ID')} KK
            </div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>Status Data SID</div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginTop: '4px',
                lineHeight: 1.3,
              }}
            >
              {asOfText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
