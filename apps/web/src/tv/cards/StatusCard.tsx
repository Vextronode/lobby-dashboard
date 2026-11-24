import type { StatusDisplay } from '@lobby/contract';
import { formatWibTime } from '@lobby/core';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';

export interface StatusCardProps {
  readonly display: StatusDisplay;
}

export function StatusCard({ display }: StatusCardProps) {
  const { level, reason, stale_hold, last_updated_at } = display;

  let levelClass: string;
  let levelText: string;
  let levelIcon: string;

  switch (level) {
    case 'GREEN':
      levelClass = styles.statusGreen ?? '';
      levelText = copy.status.safe;
      levelIcon = '✓';
      break;
    case 'YELLOW':
      levelClass = styles.statusYellow ?? '';
      levelText = copy.status.waspada;
      levelIcon = '▲';
      break;
    case 'ORANGE':
      levelClass = styles.statusOrange ?? '';
      levelText = copy.status.siaga;
      levelIcon = '◆';
      break;
    case 'RED':
      levelClass = styles.statusRed ?? '';
      levelText = copy.status.awas;
      levelIcon = '⬡';
      break;
    case 'UNKNOWN':
    default:
      levelClass = styles.statusUnknown ?? '';
      levelText = copy.status.dataNotCurrent;
      levelIcon = '•';
      break;
  }

  const formattedTime = last_updated_at ? formatWibTime(new Date(last_updated_at)) : '';
  const cardClassName = [styles.card, levelClass].filter(Boolean).join(' ');

  return (
    <div className={cardClassName}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>🛡️</span>
          <h2 className={styles.cardTitle}>{copy.status.cardTitle}</h2>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.statusLevelBadge}>
          <span>{levelIcon}</span>
          <span>{levelText}</span>
        </div>
        <div className={styles.statusReason}>{reason || copy.status.noActiveAlert}</div>
        {stale_hold && formattedTime && (
          <div className={styles.statusNoticeText}>{copy.status.staleNotice(formattedTime)}</div>
        )}
      </div>
    </div>
  );
}
