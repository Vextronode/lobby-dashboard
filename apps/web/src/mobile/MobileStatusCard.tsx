import type { StatusDisplay } from '@lobby/contract';
import styles from '../design/mobile.module.css';
import { copy } from '../shared/copy/id';

export interface MobileStatusCardProps {
  readonly display: StatusDisplay;
}

export function MobileStatusCard({ display }: MobileStatusCardProps) {
  const { level, reason, notice, stale_hold } = display;

  const badgeClass =
    level === 'GREEN'
      ? styles.statusBadgeGreen
      : level === 'YELLOW'
        ? styles.statusBadgeYellow
        : level === 'ORANGE'
          ? styles.statusBadgeOrange
          : styles.statusBadgeUnknown;

  const cardClass =
    level === 'GREEN'
      ? styles.statusCardGreen
      : level === 'YELLOW'
        ? styles.statusCardYellow
        : level === 'ORANGE'
          ? styles.statusCardOrange
          : styles.statusCardUnknown;

  const label =
    level === 'GREEN'
      ? copy.status.safe
      : level === 'YELLOW'
        ? copy.status.waspada
        : level === 'ORANGE'
          ? copy.status.siaga
          : level === 'RED'
            ? copy.status.awas
            : copy.status.unknown;

  const badgeClasses = [styles.statusBadge, badgeClass].filter(Boolean).join(' ');
  const cardClasses = [styles.card, styles.statusCard, cardClass].filter(Boolean).join(' ');

  return (
    <section className={cardClasses}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{copy.status.cardTitle}</h2>
        <span className={badgeClasses}>{label}</span>
      </div>

      <p className={styles.statusReason}>{reason || copy.status.noActiveAlert}</p>

      {stale_hold && <div className={styles.statusNotice}>{copy.status.dataNotCurrent}</div>}

      {notice && <div className={styles.statusNotice}>{notice.text}</div>}
    </section>
  );
}
