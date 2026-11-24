import type { ContentResponse, StatusResponse } from '@lobby/contract';
import { formatWibDateId, formatWibTime } from '@lobby/core';
import { useEffect, useState } from 'react';
import styles from '../design/tv.module.css';
import { QrCode } from '../shared/components/QrCode';
import { copy } from '../shared/copy/id';
import { CiMartCard } from './cards/CiMartCard';
import { CitizenProfileCard } from './cards/CitizenProfileCard';
import { LetterServicesCard } from './cards/LetterServicesCard';
import { PopulationCard } from './cards/PopulationCard';
import { QuakeListCard } from './cards/QuakeListCard';
import { QuakePangandaranCard } from './cards/QuakePangandaranCard';
import { StatusCard } from './cards/StatusCard';
import { WeatherCard } from './cards/WeatherCard';
import { TickerBar } from './ticker/TickerBar';

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
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandBadge}>LOBBY</span>
          <div>
            <h1 className={styles.brandTitle}>{copy.village.name}</h1>
            <p className={styles.brandSubtitle}>{copy.village.subdistrict}</p>
          </div>
        </div>
        <div className={styles.clockArea}>
          <div>
            <div className={styles.clockTime}>{formatWibTime(clockDate)} WIB</div>
            <div className={styles.clockDate}>{formatWibDateId(clockDate)}</div>
          </div>
        </div>
      </header>

      {/* Main Grid: Left Column (Disaster/Safety) & Right Column (Services/Demographics) */}
      <main className={styles.mainGrid}>
        <section className={styles.leftColumn}>
          <StatusCard display={status.status.display} />
          {modules && (
            <>
              <QuakePangandaranCard module={modules.quake_pangandaran} />
              <QuakeListCard module={modules.quake_list} serverTimeOffsetMs={serverTimeOffsetMs} />
            </>
          )}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-md)',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Subcolumn 1: Weather, Letters, CiMart */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              height: '100%',
            }}
          >
            {modules && (
              <>
                <WeatherCard module={modules.weather} serverTimeOffsetMs={serverTimeOffsetMs} />
                <LetterServicesCard
                  module={modules.sid_services}
                  serverTimeOffsetMs={serverTimeOffsetMs}
                />
                <CiMartCard module={modules.cimart} serverTimeOffsetMs={serverTimeOffsetMs} />
              </>
            )}
          </div>

          {/* Subcolumn 2: Population & Citizen Profile */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              height: '100%',
            }}
          >
            {modules && (
              <>
                <PopulationCard module={modules.sid_population} />
                <CitizenProfileCard
                  module={modules.sid_population}
                  serverTimeOffsetMs={serverTimeOffsetMs}
                />
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer: Marquee Ticker + Client-side QR Code */}
      <footer className={styles.footer}>
        <div className={styles.tickerArea}>
          <TickerBar status={status} content={content} />
        </div>
        <aside className={styles.qrWidget} aria-label="Kode QR Papan Informasi">
          <QrCode value={publicUrl} size={36} />
          <div className={styles.qrText}>
            <span>{copy.common.scanQrLabel}</span>
          </div>
        </aside>
      </footer>
    </div>
  );
}
