import type { EvacPoint, Contact } from '@lobby/contract';
import styles from '../design/mobile.module.css';
import { copy } from '../shared/copy/id';

export interface MobileEmergencyBannerProps {
  readonly reason: string;
  readonly evacuationPoints: readonly EvacPoint[];
  readonly contacts: readonly Contact[];
}

export function MobileEmergencyBanner({
  reason,
  evacuationPoints,
  contacts,
}: MobileEmergencyBannerProps) {
  return (
    <section className={styles.emergencyBanner} role="alert" aria-live="assertive">
      <div className={styles.emergencyHeader}>
        <span className={styles.emergencyBadge}>{copy.mobile.emergencyTitle}</span>
        <h2 className={styles.emergencyTitle}>{reason || copy.awas.subtitle}</h2>
      </div>

      {/* Titik Kumpul Evakuasi */}
      <div className={styles.emergencySection}>
        <h3 className={styles.emergencySectionTitle}>{copy.mobile.evacuationTitle}</h3>
        {evacuationPoints.length > 0 ? (
          <div className={styles.evacList}>
            {evacuationPoints.map((point) => (
              <div key={point.id} className={styles.evacItem}>
                <div className={styles.evacName}>{point.name}</div>
                {point.address && <div className={styles.evacAddress}>{point.address}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emergencyReason}>{copy.mobile.followVillageStaff}</p>
        )}
      </div>

      {/* Kontak Darurat dengan direct tel: link */}
      <div className={styles.emergencySection}>
        <h3 className={styles.emergencySectionTitle}>{copy.mobile.contactsTitle}</h3>
        <div className={styles.contactGrid}>
          {contacts.map((contact) => {
            const callLabel = copy.mobile.directCall;
            const ariaLabel = `${callLabel} ${contact.institution}`;

            return (
              <a
                key={contact.id}
                href={`tel:${contact.phone_number}`}
                className={styles.contactButton}
                aria-label={ariaLabel}
              >
                <span>{contact.institution}</span>
                <span className={styles.contactNumber}>{contact.phone_number}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
