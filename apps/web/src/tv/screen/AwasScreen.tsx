import type { ContentResponse, StatusResponse } from '@lobby/contract';
import { formatWibTime } from '@lobby/core';
import styles from '../../design/awas.module.css';
import { copy } from '../../shared/copy/id';
import { TickerBar } from '../ticker/TickerBar';

export interface AwasScreenProps {
  readonly status: StatusResponse;
  readonly content: ContentResponse | null;
}

export function AwasScreen({ status, content }: AwasScreenProps) {
  const display = status.status.display;
  const preparedness = content?.modules.preparedness.data;

  const evacPoints = preparedness ? preparedness.evacuation_points.slice(0, 3) : [];
  const contacts = preparedness ? preparedness.contacts.slice(0, 4) : [];

  const timeText = display.last_updated_at
    ? formatWibTime(new Date(display.last_updated_at))
    : formatWibTime(new Date(status.server_time));

  return (
    <div className={styles.awasContainer} role="alert" aria-live="assertive">
      <header className={styles.awasHeader}>
        <div className={styles.awasBadge}>
          <span>⬡</span>
          <span>{copy.awas.title}</span>
        </div>
        <h1 className={styles.awasTitle}>{display.reason || copy.awas.subtitle}</h1>
        <p className={styles.awasReason}>
          {copy.awas.updatedAtLabel} {timeText} WIB
        </p>
      </header>

      <main className={styles.awasBody}>
        {/* Titik Kumpul Evakuasi */}
        <section className={styles.sectionBox}>
          <h2 className={styles.sectionTitle}>{copy.awas.evacTitle}</h2>
          {evacPoints.length > 0 ? (
            <div className={styles.itemList}>
              {evacPoints.map((point) => (
                <div key={point.id} className={styles.itemCard}>
                  <div className={styles.itemName}>{point.name}</div>
                  {point.address && <div className={styles.itemSub}>{point.address}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.itemSub}>{copy.awas.noEvacNotice}</p>
          )}
        </section>

        {/* Kontak Darurat */}
        <section className={styles.sectionBox}>
          <h2 className={styles.sectionTitle}>{copy.awas.contactTitle}</h2>
          {contacts.length > 0 ? (
            <div className={styles.itemList}>
              {contacts.map((contact) => (
                <div key={contact.id} className={styles.itemCard}>
                  <div className={styles.itemName}>{contact.institution}</div>
                  <div
                    className={styles.itemSub}
                    style={{ fontSize: '16px', fontWeight: 700, color: '#fef08a' }}
                  >
                    {contact.phone_number}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.itemSub}>112 / BPBD Pangandaran</p>
          )}
        </section>
      </main>

      <footer className={styles.awasFooter}>
        <TickerBar status={status} content={content} />
      </footer>
    </div>
  );
}
