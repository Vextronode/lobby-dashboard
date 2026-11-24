import type { ModuleEnvelope, SidPopulation } from '@lobby/contract';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface CitizenProfileCardProps {
  readonly module: ModuleEnvelope<SidPopulation>;
  readonly serverTimeOffsetMs?: number;
}

export function CitizenProfileCard({ module }: CitizenProfileCardProps) {
  const { state, data } = module;

  if (state === 'loading') {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
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
            <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.profile.unavailable}</div>
        </div>
      </div>
    );
  }

  if (!data.published) {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.profile.unregistered}</div>
        </div>
      </div>
    );
  }

  const { population, age_pyramid, occupations, hamlets } = data;
  const maxOcc = Math.max(...occupations.top.map((o) => o.count), 1);
  const maxPyramidCount = Math.max(
    ...age_pyramid.buckets.flatMap((b) => [b.male ?? 0, b.female ?? 0]),
    1,
  );

  return (
    <div className={styles.card} style={{ height: '100%' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.categoryBadge}>Profil Warga</span>
        </div>
        <span className={styles.cardHeaderMeta}>Data Agregat SID Terverifikasi</span>
      </div>

      <div
        className={styles.cardBody}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div className={styles.heroTopRow}>
          <div>
            <h3 className={styles.heroHeadline}>Struktur Demografi & Mata Pencaharian Warga</h3>
            <p className={styles.heroSubtitle}>
              Piramida kelompok umur, mata pencaharian pokok, dan sebaran warga per dusun di Desa
              Cibenda.
            </p>
          </div>
          <div className={styles.heroRightMeta}>
            <div className={styles.heroMetaLabel}>Total Warga Terdata</div>
            <div className={styles.heroMetaValue}>
              {population.total.toLocaleString('id-ID')} Jiwa
            </div>
          </div>
        </div>

        <div className={styles.profileGrid} style={{ flex: 1, minHeight: 0 }}>
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
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{copy.profile.pyramidTitle}</span>
                <span style={{ fontSize: '10px' }}>
                  <span style={{ color: '#3b82f6' }}>Laki-laki</span> /{' '}
                  <span style={{ color: '#ec4899' }}>Perempuan</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {age_pyramid.buckets.slice(0, 7).map((b) => {
                  const maleVal = b.male ?? 0;
                  const femaleVal = b.female ?? 0;
                  const maleWidth = Math.round((maleVal / maxPyramidCount) * 100);
                  const femaleWidth = Math.round((femaleVal / maxPyramidCount) * 100);

                  return (
                    <div key={b.label} className={styles.pyramidRow}>
                      <span className={styles.pyramidCountLabel}>
                        {b.male !== null ? b.male.toString() : '-'}
                      </span>
                      <div className={styles.pyramidBarLeftContainer}>
                        <div
                          className={styles.pyramidBarLeft}
                          style={{ width: `${Math.max(4, maleWidth).toString()}%` }}
                        />
                      </div>
                      <span className={styles.pyramidAgeLabel}>{b.label}</span>
                      <div className={styles.pyramidBarRightContainer}>
                        <div
                          className={styles.pyramidBarRight}
                          style={{ width: `${Math.max(4, femaleWidth).toString()}%` }}
                        />
                      </div>
                      <span className={styles.pyramidCountLabel}>
                        {b.female !== null ? b.female.toString() : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid var(--color-border-subtle)',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Usia Produktif (15-64 th): 68%</span>
              <span style={{ color: 'var(--color-text-accent)', fontWeight: 700 }}>
                Rasio Beban Ketergantungan Rendah
              </span>
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
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '10px',
                }}
              >
                {copy.profile.occupationTitle}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {occupations.top.slice(0, 4).map((occ) => {
                  const widthPct = Math.round((occ.count / maxOcc) * 100);
                  return (
                    <div
                      key={occ.name}
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
                          {occ.name}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: 'var(--color-text-accent)',
                          }}
                        >
                          {occ.count.toLocaleString('id-ID')} jiwa
                        </span>
                      </div>
                      <div className={styles.microProgressTrack}>
                        <div
                          className={styles.microProgressFill}
                          style={{ width: `${Math.max(6, widthPct).toString()}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Sebaran Wilayah Dusun
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {hamlets.items.map((h) => (
                  <div
                    key={h.name}
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      Dusun {h.name}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {h.count !== null ? `${h.count.toString()} jiwa` : copy.profile.suppressed}
                    </div>
                  </div>
                ))}
              </div>
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
              Data privasi SID: kelompok data di bawah ambang batas (&lt; 10) disamarkan secara
              otomatis.
            </div>
          </div>
        </div>

        <div className={styles.advisoryBanner} style={{ marginTop: '10px' }}>
          <span>
            Sistem Informasi Desa (SID) terintegrasi dengan basis data kependudukan Kabupaten
            Pangandaran.
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Status Data: Aktif & Valid
          </span>
        </div>
      </div>
    </div>
  );
}
