import type { ContentResponse, StatusResponse } from '@lobby/contract';
import { buildTicker } from '@lobby/core';
import styles from '../../design/ticker.module.css';

export interface TickerBarProps {
  readonly status: StatusResponse | null;
  readonly content: ContentResponse | null;
}

export function TickerBar({ status, content }: TickerBarProps) {
  const display = status?.status.display;
  const preparedness = content?.modules.preparedness.data;
  const sidServices = content?.modules.sid_services.data;
  const staticConfig = content?.static;

  const tickerItems = buildTicker({
    mode: display?.ticker_mode ?? 'normal',
    level: display?.level ?? 'UNKNOWN',
    reason: display?.reason,
    evacuationPoints: preparedness?.evacuation_points,
    notice: display?.notice?.text,
    announcements: sidServices?.announcements,
    tips: staticConfig?.tips,
  });

  return (
    <div className={styles.tickerContainer} aria-label="Informasi Berjalan">
      <div className={styles.tickerTrack}>
        {tickerItems.map((item, idx) => (
          <span key={`${item}-${idx.toString()}`} className={styles.tickerItem}>
            <span>{item}</span>
            <span className={styles.tickerSeparator}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
