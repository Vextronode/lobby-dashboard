import type { ModuleEnvelope, QuakeList } from '@lobby/contract';
import { formatWibTime } from '@lobby/core';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface QuakeListCardProps {
  readonly module: ModuleEnvelope<QuakeList>;
  readonly serverTimeOffsetMs?: number;
}

export function QuakeListCard({ module }: QuakeListCardProps) {
  const { state, data, fetched_at } = module;
  const items = data?.items ?? [];

  if (state === 'loading') {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
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
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
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
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
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

  const latestQuake = items[0];

  return (
    <div className={styles.card} style={{ height: '100%' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.categoryBadge}>{copy.quakeList.cardTitle}</span>
        </div>
        <span className={styles.cardHeaderMeta}>Jejaring Seismograf Nasional BMKG</span>
      </div>

      <div
        className={styles.cardBody}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div className={styles.heroTopRow}>
          <div>
            <h3 className={styles.heroHeadline}>Pemantauan Gempa Bumi Wilayah</h3>
            <p className={styles.heroSubtitle}>
              Daftar getaran dan gempa tektonik terkini di wilayah Jawa Barat dan sekitarnya.
            </p>
          </div>
          <div className={styles.heroRightMeta}>
            <div className={styles.heroMetaLabel}>Status Pemantauan</div>
            <div className={styles.heroMetaValue} style={{ fontSize: '20px', color: '#059669' }}>
              Aktif 24 Jam
            </div>
          </div>
        </div>

        {latestQuake && (
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
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
                }}
              >
                Gempa Terakhir Tercatat
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginTop: '2px',
                }}
              >
                {latestQuake.location}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  marginTop: '2px',
                }}
              >
                Kedalaman: {latestQuake.depth} · Waktu:{' '}
                {formatWibTime(new Date(latestQuake.updated_at))} WIB
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--color-text-accent)',
                  lineHeight: 1,
                }}
              >
                M {latestQuake.magnitude.toFixed(1)}
              </div>
              <div className={styles.badgeSuccess} style={{ marginTop: '6px' }}>
                <span>Tidak Berpotensi Tsunami</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.bentoGrid3} style={{ marginBottom: '8px' }}>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>Status Pesisir Cibenda</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
              Kondusif & Aman
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Nihil ancaman gelombang laut
            </div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>Aktivitas Seismik Jabar</div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginTop: '2px',
              }}
            >
              2 Gempa Terdeteksi
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Tasikmalaya & Garut
            </div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricBoxLabel}>Sensor Pemantauan</div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text-accent)',
                marginTop: '2px',
              }}
            >
              BMKG Terhubung
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Sinkronisasi data otomatis
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <table className={styles.quakeTable} style={{ width: '100%', height: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', height: '28px' }}>
                <th
                  style={{
                    textAlign: 'left',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    width: '68px',
                  }}
                >
                  Wilayah
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    width: '60px',
                  }}
                >
                  Magnitudo
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                  }}
                >
                  Pusat Gempa Terdeteksi
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    width: '85px',
                  }}
                >
                  Kedalaman
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    width: '80px',
                  }}
                >
                  Waktu WIB
                </th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 5).map((quake, idx) => {
                const isJabar = quake.tag === 'Jabar';
                const eventTime = formatWibTime(new Date(quake.updated_at));
                const tagClasses = [styles.quakeTag, isJabar ? styles.quakeTagJabar : '']
                  .filter(Boolean)
                  .join(' ');

                return (
                  <tr
                    key={`${quake.updated_at}-${idx.toString()}`}
                    style={{ height: 'calc(100% / 5)' }}
                  >
                    <td style={{ width: '68px' }}>
                      <span className={tagClasses}>{quake.tag}</span>
                    </td>
                    <td
                      style={{
                        width: '60px',
                        fontWeight: 800,
                        fontSize: '13px',
                        color: isJabar ? '#0284c7' : 'var(--color-text-accent)',
                      }}
                    >
                      M {quake.magnitude.toFixed(1)}
                    </td>
                    <td
                      style={{
                        color: 'var(--color-text-primary)',
                        fontWeight: 600,
                        fontSize: '12px',
                      }}
                    >
                      {quake.location}
                    </td>
                    <td
                      style={{
                        width: '85px',
                        color: 'var(--color-text-secondary)',
                        fontSize: '11px',
                      }}
                    >
                      {quake.depth}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        width: '80px',
                      }}
                    >
                      {eventTime} WIB
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.advisoryBanner} style={{ marginTop: '8px' }}>
          <span>
            Bila merasakan gempa bumi kuat: Lindungi kepala dan evakuasi ke titik kumpul terbuka di
            Lapang Karanganyar.
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-accent)' }}>
            Posko Darurat BPBD: 112
          </span>
        </div>
      </div>
    </div>
  );
}
