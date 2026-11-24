import type { LobbyCimart, ModuleEnvelope } from '@lobby/contract';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';
import { useGlobalBeat } from '../../shared/hooks/useGlobalBeat';

export interface CiMartCardProps {
  readonly module: ModuleEnvelope<LobbyCimart>;
  readonly serverTimeOffsetMs?: number;
}

export function CiMartCard({ module, serverTimeOffsetMs = 0 }: CiMartCardProps) {
  const { state, data } = module;

  // F09: Phase 1: products.length + 1 slides. Phase 0: 3 slides. Unavailable: 1 slide
  const phase = data?.phase ?? 0;
  const products = data?.featured_products ?? [];
  const slideCount =
    state !== 'ok' && state !== 'stale' ? 1 : phase === 1 ? products.length + 1 : 3;

  const { slideIndex } = useGlobalBeat(slideCount, serverTimeOffsetMs);

  if (state === 'loading') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🛍️</span>
            <h2 className={styles.cardTitle}>{copy.cimart.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.common.loading}</div>
        </div>
      </div>
    );
  }

  // F09 R-7: unavailable displays neutral text without "Segera hadir"
  if (state === 'unavailable' || !data) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🛍️</span>
            <h2 className={styles.cardTitle}>{copy.cimart.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.cimart.unavailable}</div>
        </div>
      </div>
    );
  }

  // Phase 0: 3 slides
  if (phase === 0) {
    const titles = [copy.cimart.phase0Title, 'Apa itu CiMart?', 'Ajakan Pendaftaran'];
    const safeIndex = slideIndex < 3 ? slideIndex : 0;

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🛍️</span>
            <h2 className={styles.cardTitle}>{copy.cimart.cardTitle}</h2>
          </div>
          <span className={styles.cardHeaderMeta}>{titles[safeIndex]}</span>
        </div>
        <div className={styles.cardBody}>
          {safeIndex === 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
                {copy.cimart.phase0Title}
              </div>
              <div
                style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}
              >
                {copy.cimart.phase0Description}
              </div>
            </div>
          )}
          {safeIndex === 1 && (
            <div>
              <div
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}
              >
                Marketplace Digital Warga Desa Cibenda
              </div>
              <div
                style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}
              >
                Wadah promosi produk olahan, kerajinan, dan kuliner khas desa untuk warga dan
                wisatawan.
              </div>
            </div>
          )}
          {safeIndex === 2 && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
              {copy.cimart.phase0Cta}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Phase 1: Products + 1 CTA slide per cycle (F09 R-6)
  const isCtaSlide = slideIndex >= products.length;

  if (isCtaSlide) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>🛍️</span>
            <h2 className={styles.cardTitle}>{copy.cimart.cardTitle}</h2>
          </div>
          <span className={styles.cardHeaderMeta}>Informasi Usaha</span>
        </div>
        <div className={styles.cardBody}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
            {copy.cimart.phase1CtaTitle}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {copy.cimart.phase1CtaText}
          </div>
        </div>
      </div>
    );
  }

  const currentProduct = products[slideIndex] ?? products[0];
  if (!currentProduct) {
    return null;
  }
  const priceFormatted = `Rp${currentProduct.price.toLocaleString('id-ID')}`;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>🛍️</span>
          <h2 className={styles.cardTitle}>{copy.cimart.cardTitle}</h2>
        </div>
        <span className={styles.cardHeaderMeta}>{currentProduct.category.name}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cimartProduct}>
          {currentProduct.image_url ? (
            <img
              src={currentProduct.image_url}
              alt={currentProduct.name}
              className={styles.cimartThumb}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className={styles.cimartThumbFallback}>
              {currentProduct.category.name || copy.cimart.defaultCategory}
            </div>
          )}
          <div className={styles.cimartInfo}>
            <div className={styles.cimartName}>{currentProduct.name}</div>
            <div className={styles.cimartPrice}>{priceFormatted}</div>
            <div className={styles.cimartShop}>{currentProduct.store.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
