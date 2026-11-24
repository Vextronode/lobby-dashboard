import type { LobbyCimart, ModuleEnvelope } from '@lobby/contract';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface CiMartCardProps {
  readonly module: ModuleEnvelope<LobbyCimart>;
  readonly serverTimeOffsetMs?: number;
}

export function CiMartCard({ module }: CiMartCardProps) {
  const { state, data } = module;

  const phase = data?.phase ?? 0;
  const products = data?.featured_products ?? [];

  if (state === 'loading') {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h2 className={styles.cardTitle}>{copy.cimart.cardTitle}</h2>
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
            <h2 className={styles.cardTitle}>{copy.cimart.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.cimart.unavailable}</div>
        </div>
      </div>
    );
  }

  if (phase === 0) {
    return (
      <div className={styles.card} style={{ height: '100%' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.categoryBadge}>{copy.cimart.cardTitle}</span>
          </div>
          <span className={styles.cardHeaderMeta}>Marketplace Warga Desa</span>
        </div>
        <div
          className={styles.cardBody}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div className={styles.heroTopRow}>
            <div>
              <h3 className={styles.heroHeadline}>Etalase Digital Produk Warga Desa Cibenda</h3>
              <p className={styles.heroSubtitle}>{copy.cimart.phase0Description}</p>
            </div>
          </div>

          <div className={styles.weatherGrid} style={{ flex: 1, margin: '14px 0' }}>
            <div className={styles.weatherCol}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-accent)' }}>
                {copy.cimart.phase0Title}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '10px',
                  lineHeight: 1.5,
                }}
              >
                Platform digital resmi desa untuk memasarkan hasil bumi, olahan kuliner, dan
                kerajinan tangan warga.
              </div>
            </div>

            <div className={styles.weatherCol}>
              <div
                style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)' }}
              >
                Dukungan UMKM Lokal
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '10px',
                  lineHeight: 1.5,
                }}
              >
                Membantu pedagang dan pengrajin lokal menjangkau pembeli warga sekitar hingga
                wisatawan Pangandaran.
              </div>
            </div>

            <div className={styles.weatherCol}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-accent)' }}>
                Pendaftaran Usaha
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '10px',
                  lineHeight: 1.5,
                }}
              >
                {copy.cimart.phase0Cta}
              </div>
            </div>
          </div>

          <div className={styles.advisoryBanner}>
            <span>Dikelola oleh Badan Usaha Milik Desa (BUMDes) Cibenda Sejahtera.</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text-accent)' }}>
              Pendaftaran Gratis di Kantor Desa
            </span>
          </div>
        </div>
      </div>
    );
  }

  const displayProducts = products.slice(0, 6);

  return (
    <div className={styles.card} style={{ height: '100%' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.categoryBadge}>{copy.cimart.cardTitle}</span>
        </div>
        <span className={styles.cardHeaderMeta}>Katalog Produk Usaha Warga Desa Cibenda</span>
      </div>

      <div
        className={styles.cardBody}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div className={styles.heroTopRow}>
          <div>
            <h3 className={styles.heroHeadline}>Produk Unggulan Usaha Mikro & Warga Desa</h3>
            <p className={styles.heroSubtitle}>
              Karya olahan, kuliner khas, dan kerajinan tangan hasil usaha warga Desa Cibenda.
            </p>
          </div>
          <div className={styles.heroRightMeta}>
            <div className={styles.heroMetaLabel}>Produk Terdaftar</div>
            <div className={styles.heroMetaValue}>{products.length.toString()} Produk</div>
          </div>
        </div>

        <div className={styles.cimartGrid} style={{ flex: 1, minHeight: 0 }}>
          {displayProducts.map((p) => {
            const priceFormatted = `Rp${p.price.toLocaleString('id-ID')}`;

            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: 'var(--color-bg-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className={styles.cimartThumb}
                    style={{ width: '64px', height: '64px', flexShrink: 0 }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className={styles.cimartThumbFallback}
                    style={{
                      width: '64px',
                      height: '64px',
                      fontSize: '10px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {p.category.name || copy.cimart.defaultCategory}
                  </div>
                )}
                <div className={styles.cimartInfo} style={{ gap: '2px', minWidth: 0 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      backgroundColor: 'var(--color-bg-badge-blue)',
                      border: '1px solid #bfdbfe',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 6px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: 'var(--color-text-accent)',
                    }}
                  >
                    {p.category.name}
                  </div>
                  <div
                    className={styles.cimartName}
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={p.name}
                  >
                    {p.name}
                  </div>
                  <div className={styles.cimartPrice} style={{ fontSize: '15px', fontWeight: 800 }}>
                    {priceFormatted} {p.unit ? `/ ${p.unit}` : ''}
                  </div>
                  <div
                    className={styles.cimartShop}
                    style={{
                      fontSize: '10px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Penjual: <strong>{p.store.name}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.advisoryBanner} style={{ marginTop: '10px' }}>
          <span>
            Punya produk usaha olahan atau kerajinan? Daftarkan produk Anda ke etalase digital
            CiMart desa.
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-accent)' }}>
            Hubungi Seksi Perekonomian Desa
          </span>
        </div>
      </div>
    </div>
  );
}
