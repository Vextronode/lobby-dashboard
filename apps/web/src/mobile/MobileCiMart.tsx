import type { LobbyCimart, ModuleEnvelope } from '@lobby/contract';
import styles from '../design/mobile.module.css';
import { copy } from '../shared/copy/id';

export interface MobileCiMartProps {
  readonly cimartModule: ModuleEnvelope<LobbyCimart>;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MobileCiMart({ cimartModule }: MobileCiMartProps) {
  const { state, data } = cimartModule;
  const phase = data?.phase ?? 0;
  const products = data?.featured_products ?? [];

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{copy.cimart.cardTitle}</h2>
        <span className={styles.cardSubtitle}>Pasar Online Desa</span>
      </div>

      {phase === 0 || state !== 'ok' || products.length === 0 ? (
        <div className={styles.phase0Box}>
          <h3 className={styles.phase0Headline}>{copy.cimart.phase0Title}</h3>
          <p className={styles.phase0Text}>{copy.cimart.phase0Description}</p>
          <p
            className={styles.phase0Text}
            style={{ fontWeight: 600, color: 'var(--color-text-accent)' }}
          >
            {copy.cimart.phase0Cta}
          </p>
        </div>
      ) : (
        <div className={styles.productStrip}>
          {products.map((product) => (
            <a
              key={product.id}
              href={product.url}
              target="_self"
              className={styles.productItem}
              aria-label={`${product.name} - ${formatRupiah(product.price)}`}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className={styles.productThumb}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className={styles.productThumbPlaceholder}>{copy.cimart.noPhoto}</div>
              )}
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                <div className={styles.productPrice}>
                  {formatRupiah(product.price)}
                  {product.unit ? ` / ${product.unit}` : ''}
                </div>
                <div className={styles.productStore}>{product.store.name}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
