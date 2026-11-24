import type { AppLink } from '@lobby/contract';
import styles from '../design/mobile.module.css';
import { copy } from '../shared/copy/id';

export interface MobileAppLauncherProps {
  readonly appLinks: readonly AppLink[];
}

export function MobileAppLauncher({ appLinks }: MobileAppLauncherProps) {
  const descriptions: Readonly<Record<string, string>> = copy.mobile.appDescriptions;

  return (
    <section id="aplikasi" className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{copy.mobile.appsTitle}</h2>
      </div>
      <p className={styles.cardSubtitle}>{copy.mobile.appsSubtitle}</p>

      <div className={styles.appList}>
        {appLinks.map((app) => {
          const desc = descriptions[app.id] ?? copy.mobile.openApp;
          const ariaLabel = `${app.label}: ${descriptions[app.id] ?? app.label}`;

          return (
            <a
              key={app.id}
              href={app.url}
              target="_self"
              className={styles.appCard}
              aria-label={ariaLabel}
            >
              <div className={styles.appCardContent}>
                <span className={styles.appCardLabel}>{app.label}</span>
                <span className={styles.appCardDesc}>{desc}</span>
              </div>
              <svg
                className={styles.appCardArrow}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          );
        })}
      </div>
    </section>
  );
}
