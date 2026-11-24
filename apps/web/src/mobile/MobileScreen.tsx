import type { ContentResponse, StatusResponse } from '@lobby/contract';
import { formatWibTime } from '@lobby/core';
import { useCallback, useEffect, useState } from 'react';
import styles from '../design/mobile.module.css';
import { fetchLobbyContent, fetchLobbyStatus } from '../shared/api/lobby-api';
import { copy } from '../shared/copy/id';
import { usePoll } from '../shared/hooks/usePoll';
import { MobileAnnouncement } from './MobileAnnouncement';
import { MobileAppLauncher } from './MobileAppLauncher';
import { MobileCiMart } from './MobileCiMart';
import { MobileEmergencyBanner } from './MobileEmergencyBanner';
import { MobileHeader } from './MobileHeader';
import { MobileStatusCard } from './MobileStatusCard';
import { MobileWeatherQuake } from './MobileWeatherQuake';

const MOBILE_POLL_INTERVAL_MS = 30_000;
const STORAGE_STATUS_KEY = 'lobby_cache_status';
const STORAGE_CONTENT_KEY = 'lobby_cache_content';

function loadInitialStatus(): StatusResponse | null {
  try {
    const cached = localStorage.getItem(STORAGE_STATUS_KEY);
    return cached ? (JSON.parse(cached) as StatusResponse) : null;
  } catch {
    return null;
  }
}

function loadInitialContent(): ContentResponse | null {
  try {
    const cached = localStorage.getItem(STORAGE_CONTENT_KEY);
    return cached ? (JSON.parse(cached) as ContentResponse) : null;
  } catch {
    return null;
  }
}

export function MobileScreen() {
  const [cachedStatus] = useState<StatusResponse | null>(loadInitialStatus);
  const [cachedContent] = useState<ContentResponse | null>(loadInitialContent);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await fetchLobbyStatus();
    try {
      localStorage.setItem(STORAGE_STATUS_KEY, JSON.stringify(res));
    } catch {
      // ignore storage errors
    }
    return res;
  }, []);

  const fetchContent = useCallback(async () => {
    const res = await fetchLobbyContent();
    try {
      localStorage.setItem(STORAGE_CONTENT_KEY, JSON.stringify(res));
    } catch {
      // ignore storage errors
    }
    return res;
  }, []);

  const { data: statusData, refetch: refetchStatus } = usePoll<StatusResponse>({
    fn: fetchStatus,
    intervalMs: MOBILE_POLL_INTERVAL_MS,
    pauseWhenHidden: true,
  });

  const { data: contentData, refetch: refetchContent } = usePoll<ContentResponse>({
    fn: fetchContent,
    intervalMs: MOBILE_POLL_INTERVAL_MS,
    pauseWhenHidden: true,
  });

  const activeStatus = statusData ?? cachedStatus;
  const activeContent = contentData ?? cachedContent;

  const handleManualRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchStatus(), refetchContent()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchStatus, refetchContent]);

  // Handle URL hash navigation (e.g. /#aplikasi, AC-F11-2)
  useEffect(() => {
    if (window.location.hash === '#aplikasi') {
      const el = document.getElementById('aplikasi');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeContent]);

  const display = activeStatus?.status.display;
  const isAwas = display?.awas === true;
  const preparedness = activeContent?.modules.preparedness.data;
  const topAnnouncement = activeContent?.modules.sid_services.data?.announcements[0];

  const serverTimeMs = activeStatus?.server_time
    ? new Date(activeStatus.server_time).getTime()
    : undefined;

  const lastUpdatedTime = display?.last_updated_at
    ? formatWibTime(new Date(display.last_updated_at))
    : activeStatus?.server_time
      ? formatWibTime(new Date(activeStatus.server_time))
      : null;

  return (
    <main className={styles.container}>
      {/* Header with Village Info & Refresh Button */}
      <MobileHeader
        onRefresh={handleManualRefresh}
        isRefreshing={isManualRefreshing}
        lastUpdatedTime={lastUpdatedTime}
      />

      {/* 1. Status / Layar Darurat Awas (F01, F02, AC-F02-6) */}
      {display ? (
        isAwas ? (
          <MobileEmergencyBanner
            reason={display.reason}
            evacuationPoints={preparedness?.evacuation_points ?? []}
            contacts={preparedness?.contacts ?? []}
          />
        ) : (
          <MobileStatusCard display={display} />
        )
      ) : null}

      {/* 2. Cuaca 3 Hari & Gempa Pangandaran (F04, F05) */}
      {activeContent && (
        <MobileWeatherQuake
          weatherModule={activeContent.modules.weather}
          quakeModule={activeContent.modules.quake_pangandaran}
          serverTimeMs={serverTimeMs}
        />
      )}

      {/* 3. Satu Pengumuman Resmi Teratas (F03, F11 R-4; Hidden if none) */}
      <MobileAnnouncement announcement={topAnnouncement} />

      {/* 4. Produk CiMart (F09) */}
      {activeContent && <MobileCiMart cimartModule={activeContent.modules.cimart} />}

      {/* 5. Portal Akses 3 Aplikasi Desa (#aplikasi, F11 R-5, AC-F11-2) */}
      {activeContent && <MobileAppLauncher appLinks={activeContent.static.app_links} />}

      {/* Civic Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          {copy.village.name} · {copy.village.subdistrict}
        </p>
        <p className={styles.footerText}>{copy.village.kioskTitle}</p>
      </footer>
    </main>
  );
}
