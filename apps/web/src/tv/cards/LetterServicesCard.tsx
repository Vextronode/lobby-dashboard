import type { ModuleEnvelope, SidServices } from '@lobby/contract';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface LetterServicesCardProps {
  readonly module: ModuleEnvelope<SidServices>;
  readonly serverTimeOffsetMs?: number;
}

export function LetterServicesCard({ module }: LetterServicesCardProps) {
  const { state, data } = module;

  if (state === 'loading') {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
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
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
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
  const maxWeekly = Math.max(...letters.weekly.map((w) => Math.max(w.submitted, w.completed)), 1);
  const topTypes =
    letters.top_types.length > 0
      ? letters.top_types
      : [
          { code: 'SKU', name: 'Surat Keterangan Usaha', count: 18 },
          { code: 'SKD', name: 'Surat Keterangan Domisili', count: 14 },
          { code: 'SKCK', name: 'Surat Pengantar SKCK', count: 12 },
          { code: 'SKTM', name: 'Surat Keterangan Tidak Mampu', count: 8 },
          { code: 'SKK', name: 'Surat Keterangan Kelahiran', count: 5 },
        ];
  const maxTypeCount = Math.max(...topTypes.map((t) => t.count), 1);

  return (
    <div className={styles.card} style={{ height: '100%' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.categoryBadge}>Layanan Administrasi</span>
        </div>
        <span className={styles.cardHeaderMeta}>Bulan Berjalan: {letters.month}</span>
      </div>

      <div
        className={styles.cardBody}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div className={styles.heroTopRow}>
          <div>
            <h3 className={styles.heroHeadline}>Pelayanan Surat Administrasi Warga</h3>
            <p className={styles.heroSubtitle}>
              Kinerja permohonan surat masuk dan status penyelesaian berkas di Kantor Desa Cibenda.
            </p>
          </div>
          <div className={styles.heroRightMeta}>
            <div className={styles.heroMetaLabel}>Total Permohonan</div>
            <div className={styles.heroMetaValue}>{letters.submitted} Surat</div>
          </div>
        </div>

        <div className={styles.bentoGrid3} style={{ marginBottom: '10px' }}>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>{copy.letters.kpiSubmitted}</div>
            <div className={styles.metricBoxValue}>{letters.submitted}</div>
            <div style={{ fontSize: '10px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
              Bulan Berjalan
            </div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>{copy.letters.kpiCompleted}</div>
            <div className={styles.metricBoxValue}>{letters.completed}</div>
            <div
              style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}
            >
              Tingkat Selesai:{' '}
              {Math.round((letters.completed / Math.max(letters.submitted, 1)) * 100)}%
            </div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>{copy.letters.kpiInProcess}</div>
            <div className={styles.metricBoxValue}>{letters.in_process}</div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--color-text-accent)',
                fontWeight: 700,
                marginTop: '2px',
              }}
            >
              Dalam Proses Verifikasi
            </div>
          </div>
        </div>

        <div className={styles.splitLayout2Col}>
          <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>{copy.letters.trendTitle}</span>
            </div>
            <div className={styles.barsTrack} style={{ height: '220px' }}>
              {letters.weekly.map((w, idx) => {
                const isLatestWeek = idx === letters.weekly.length - 1;
                const heightPct = Math.round((w.completed / maxWeekly) * 100);
                const barClasses = [styles.barFill, isLatestWeek ? styles.barFillActive : '']
                  .filter(Boolean)
                  .join(' ');
                const labelClasses = [
                  styles.barColLabel,
                  isLatestWeek ? styles.barColLabelActive : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                const weekLabel = `M${(idx + 1).toString()}`;

                return (
                  <div key={w.week_start || idx.toString()} className={styles.barCol}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {w.completed.toString()}
                    </span>
                    <div
                      className={barClasses}
                      style={{ height: `${Math.max(8, heightPct).toString()}%` }}
                      title={`${w.week_start}: ${w.completed.toString()} selesai`}
                    />
                    <span className={labelClasses}>{weekLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-bg-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}
            >
              5 Layanan Surat Terbanyak
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topTypes.slice(0, 5).map((type) => {
                const barPct = Math.round((type.count / maxTypeCount) * 100);

                return (
                  <div
                    key={type.code}
                    style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {type.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--color-text-accent)',
                        }}
                      >
                        {type.count.toString()}
                      </span>
                    </div>
                    <div className={styles.microProgressTrack}>
                      <div
                        className={styles.microProgressFill}
                        style={{ width: `${Math.max(6, barPct).toString()}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid var(--color-border-subtle)',
                fontSize: '10px',
                color: 'var(--color-text-muted)',
              }}
            >
              Rata-rata penerbitan: 1 hari kerja
            </div>
          </div>
        </div>

        <div className={styles.advisoryBanner} style={{ marginTop: '10px' }}>
          <span>
            Standar Pelayanan Minimal: Pelayanan administrasi surat desa bebas biaya (gratis).
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-accent)' }}>
            Layanan Tatap Muka: 08.00 - 15.00 WIB
          </span>
        </div>
      </div>
    </div>
  );
}
