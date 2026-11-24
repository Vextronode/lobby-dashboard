import { formatWibDateTimeId } from '@lobby/core';
import styles from '../design/mobile.module.css';
import { copy } from '../shared/copy/id';

export interface MobileAnnouncementProps {
  readonly announcement?:
    | {
        readonly id: string;
        readonly title: string;
        readonly published_at: string;
      }
    | null
    | undefined;
}

export function MobileAnnouncement({ announcement }: MobileAnnouncementProps) {
  // F11 R-4: If no active announcement exists, hide cleanly without leaving empty whitespace
  if (!announcement) {
    return null;
  }

  const cardClasses = [styles.card, styles.announcementCard].filter(Boolean).join(' ');

  return (
    <section className={cardClasses}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{copy.mobile.announcementTitle}</h2>
      </div>
      <p className={styles.announcementTitle}>{announcement.title}</p>
      <div className={styles.announcementDate}>
        {formatWibDateTimeId(new Date(announcement.published_at))}
      </div>
    </section>
  );
}
