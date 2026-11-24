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
  let levelBadgeClass: string;
  let levelText: string;

  switch (level) {
    case 'GREEN':
      levelClass = styles.statusGreen ?? '';
      levelBadgeClass = styles.statusLevelBadgeGreen ?? '';
      levelText = copy.status.safe;
      break;
    case 'YELLOW':
      levelClass = styles.statusYellow ?? '';
      levelBadgeClass = styles.statusLevelBadgeYellow ?? '';
      levelText = copy.status.waspada;
      break;
    case 'ORANGE':
      levelClass = styles.statusOrange ?? '';
      levelBadgeClass = styles.statusLevelBadgeOrange ?? '';
      levelText = copy.status.siaga;
      break;
    case 'RED':
      levelClass = styles.statusRed ?? '';
      levelBadgeClass = styles.statusLevelBadgeRed ?? '';
      levelText = copy.status.awas;
      break;
    case 'UNKNOWN':
    default:
      levelClass = styles.statusUnknown ?? '';
      levelBadgeClass = styles.statusLevelBadgeUnknown ?? '';
      levelText = copy.status.dataNotCurrent;
      break;
  }

  const formattedTime = last_updated_at ? formatWibTime(new Date(last_updated_at)) : '';
  const cardClassName = [styles.card, levelClass].filter(Boolean).join(' ');
  const badgeClassName = [styles.statusLevelBadge, levelBadgeClass].filter(Boolean).join(' ');

  return (
    <div className={cardClassName}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <h2 className={styles.cardTitle}>{copy.status.cardTitle}</h2>
        </div>
        <div className={badgeClassName}>
          <span>{levelText}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.statusGrid}>
          <div className={styles.statusColCard}>
            <span className={styles.statusColTitle}>Kondisi Pesisir & Wilayah</span>
            <span className={styles.statusColText}>{reason || copy.status.noActiveAlert}</span>
            {stale_hold && formattedTime && (
              <span className={styles.statusNoticeText}>
                {copy.status.staleNotice(formattedTime)}
              </span>
            )}
          </div>

          <div className={styles.statusColCard}>
            <span className={styles.statusColTitle}>Posko Siaga & Evakuasi</span>
            <span className={styles.statusColText}>Balai Desa Cibenda (Siaga 24 Jam)</span>
            <span className={styles.statusNoticeText}>
              Jalur evakuasi utama: Lapang Karanganyar
            </span>
          </div>

          <div className={styles.statusColCard}>
            <span className={styles.statusColTitle}>Jaringan & Pemantauan</span>
            <span className={styles.statusColText}>Sensor SIGAP BMKG Terhubung Aktif</span>
            <span className={styles.statusNoticeText}>
              {formattedTime ? `Sinkronisasi: ${formattedTime} WIB` : 'Pemantauan realtime'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
