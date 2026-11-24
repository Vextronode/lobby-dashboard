import styles from '../design/mobile.module.css';
import { copy } from '../shared/copy/id';

export interface MobileHeaderProps {
  readonly onRefresh: () => Promise<void>;
  readonly isRefreshing: boolean;
  readonly lastUpdatedTime?: string | null;
}

export function MobileHeader({ onRefresh, isRefreshing, lastUpdatedTime }: MobileHeaderProps) {
  const updateNotice: string = lastUpdatedTime
    ? copy.mobile.lastUpdated(lastUpdatedTime)
    : copy.village.subdistrict;
  const refreshLabel: string = isRefreshing ? copy.mobile.refreshing : copy.mobile.refreshButton;

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.brandTitle}>{copy.village.name}</h1>
        <p className={styles.brandSubtitle}>{updateNotice}</p>
      </div>
      <div className={styles.headerActions}>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
          aria-label={refreshLabel}
        >
          {isRefreshing ? (
            <span className={styles.refreshSpinner} aria-hidden="true" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          )}
          <span>{isRefreshing ? copy.mobile.refreshing : copy.mobile.refreshButton}</span>
        </button>
      </div>
    </header>
  );
}
