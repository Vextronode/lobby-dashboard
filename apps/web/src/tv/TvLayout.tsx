import type { ContentResponse, StatusResponse } from '@lobby/contract';
import { formatWibDateId, formatWibTime } from '@lobby/core';
import { useEffect, useState } from 'react';
import styles from '../design/tv.module.css';
import { QrCode } from '../shared/components/QrCode';
import { copy } from '../shared/copy/id';
import { PopulationCard } from './cards/PopulationCard';
import { QuakePangandaranCard } from './cards/QuakePangandaranCard';
import { StatusCard } from './cards/StatusCard';
import { TickerBar } from './ticker/TickerBar';
import { TvCardCarousel } from './TvCardCarousel';

export interface TvLayoutProps {
  readonly status: StatusResponse;
  readonly content: ContentResponse | null;
  readonly serverTimeOffsetMs: number;
}

export function TvLayout({ status, content, serverTimeOffsetMs }: TvLayoutProps) {
  const [clockDate, setClockDate] = useState<Date>(() => new Date(Date.now() + serverTimeOffsetMs));

  useEffect(() => {
    const timer = setInterval(() => {
      setClockDate(new Date(Date.now() + serverTimeOffsetMs));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [serverTimeOffsetMs]);

  const modules = content?.modules;
  const publicUrl = content?.static.public_url ?? 'http://localhost:5173/';

  return (
    <div className={styles.kioskRoot}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandBadge}>LOBBY</span>
          <div>
            <h1 className={styles.brandTitle}>{copy.village.name}</h1>
            <p className={styles.brandSubtitle}>{copy.village.subdistrict}</p>
          </div>
        </div>

        <div className={styles.clockArea}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            <span>Siaran Langsung</span>
          </div>
          <div className={styles.clockContent}>
            <div className={styles.clockTime}>{formatWibTime(clockDate)} WIB</div>
            <div className={styles.clockDate}>{formatWibDateId(clockDate)}</div>
          </div>
        </div>
      </header>

      <main className={styles.mainGrid}>
        <section className={styles.leftColumn}>
          <StatusCard display={status.status.display} />
          {modules && (
            <div className={styles.leftHeroSlot}>
              <TvCardCarousel modules={modules} serverTimeOffsetMs={serverTimeOffsetMs} />
            </div>
          )}
        </section>

        <section className={styles.rightColumn}>
          {modules && (
            <>
              <PopulationCard module={modules.sid_population} />
              <QuakePangandaranCard module={modules.quake_pangandaran} />
            </>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.tickerArea}>
          <TickerBar status={status} content={content} />
        </div>
        <aside className={styles.qrWidget} aria-label="Kode QR Papan Informasi">
          <QrCode value={publicUrl} size={34} />
          <div className={styles.qrText}>
            <span>{copy.common.scanQrLabel}</span>
          </div>
        </aside>
      </footer>
    </div>
  );
}
