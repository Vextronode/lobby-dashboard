import type { ContentResponse, StatusResponse } from '@lobby/contract';
import { BEAT_INTERVAL_MS, wibClock } from '@lobby/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../design/tokens.css';
import { fetchLobbyContent, fetchLobbyStatus } from '../shared/api/lobby-api';
import { usePoll } from '../shared/hooks/usePoll';
import { TvErrorBoundary } from './recovery/TvErrorBoundary';
import { AwasScreen } from './screen/AwasScreen';
import { TvLayout } from './TvLayout';

const STATUS_POLL_INTERVAL_MS = 15_000;
const CONTENT_POLL_INTERVAL_MS = 30_000;
const CLIENT_STALE_THRESHOLD_MS = 90_000;
const STORAGE_STATUS_KEY = 'lobby_cache_status';
const STORAGE_CONTENT_KEY = 'lobby_cache_content';

interface WakeLockSentinel {
  release(): Promise<void>;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

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

export function TvScreen() {
  const [deviceId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('device') ?? 'tv-lobby-1';
  });

  const [cachedStatus] = useState<StatusResponse | null>(loadInitialStatus);
  const [cachedContent] = useState<ContentResponse | null>(loadInitialContent);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState<number>(0);

  const fetchStatus = useCallback(async () => {
    const res = await fetchLobbyStatus(deviceId);
    setServerTimeOffsetMs(new Date(res.server_time).getTime() - Date.now());
    try {
      localStorage.setItem(STORAGE_STATUS_KEY, JSON.stringify(res));
    } catch {
      // ignore storage errors
    }
    return res;
  }, [deviceId]);

  const fetchContent = useCallback(async () => {
    const res = await fetchLobbyContent();
    try {
      localStorage.setItem(STORAGE_CONTENT_KEY, JSON.stringify(res));
    } catch {
      // ignore storage errors
    }
    return res;
  }, []);

  // Polling hooks
  const { data: statusData, lastSuccessAt: statusLastSuccess } = usePoll<StatusResponse>({
    fn: fetchStatus,
    intervalMs: STATUS_POLL_INTERVAL_MS,
  });

  const { data: contentData } = usePoll<ContentResponse>({
    fn: fetchContent,
    intervalMs: CONTENT_POLL_INTERVAL_MS,
  });

  const activeStatus = statusData ?? cachedStatus;
  const activeContent = contentData ?? cachedContent;

  // Build change detector (F13 R-5)
  const serverBuildRef = useRef<string | null>(null);
  const currentBuild = activeStatus?.build ?? activeContent?.build;

  useEffect(() => {
    if (!currentBuild) return;

    if (serverBuildRef.current === null) {
      serverBuildRef.current = currentBuild;
    } else if (serverBuildRef.current !== currentBuild) {
      const now = Date.now();
      const delay = BEAT_INTERVAL_MS - (now % BEAT_INTERVAL_MS);
      setTimeout(() => {
        window.location.reload();
      }, delay);
    }
  }, [currentBuild]);

  // Scheduled reload at 03.00 WIB daily (F13 R-4)
  useEffect(() => {
    const checkScheduledReload = () => {
      const now = new Date();
      const clock = wibClock(now);
      if (clock.hour === 3 && clock.minute === 0) {
        window.location.reload();
      }
    };
    const timer = setInterval(checkScheduledReload, 60_000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  // Screen Wake Lock (F13 R-6)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const nav = navigator as unknown as NavigatorWithWakeLock;
    if (nav.wakeLock) {
      nav.wakeLock
        .request('screen')
        .then((lock) => {
          wakeLock = lock;
        })
        .catch(() => {
          // wake lock denied
        });
    }
    return () => {
      if (wakeLock) {
        void wakeLock.release();
      }
    };
  }, []);

  // F01 R-10: Client self-protection if status poll failed > 90s
  const [isClientStale, setIsClientStale] = useState<boolean>(false);
  useEffect(() => {
    const checkStale = () => {
      if (statusLastSuccess) {
        setIsClientStale(Date.now() - statusLastSuccess.getTime() > CLIENT_STALE_THRESHOLD_MS);
      }
    };
    const timer = setInterval(checkStale, 5000);
    return () => {
      clearInterval(timer);
    };
  }, [statusLastSuccess]);

  let effectiveStatus = activeStatus;
  if (activeStatus && isClientStale) {
    const lastLevel = activeStatus.status.display.level;
    if (lastLevel === 'ORANGE' || lastLevel === 'RED') {
      effectiveStatus = {
        ...activeStatus,
        status: {
          ...activeStatus.status,
          display: {
            ...activeStatus.status.display,
            stale_hold: true,
          },
        },
      };
    } else {
      effectiveStatus = {
        ...activeStatus,
        status: {
          ...activeStatus.status,
          display: {
            ...activeStatus.status.display,
            level: 'UNKNOWN',
            reason: 'Data tidak terkini',
            stale_hold: false,
          },
        },
      };
    }
  }

  if (!effectiveStatus) {
    return (
      <TvErrorBoundary>
        <div
          style={{
            width: '1280px',
            height: '720px',
            backgroundColor: 'var(--color-bg-canvas)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <h1>Papan Informasi Publik Desa Cibenda</h1>
        </div>
      </TvErrorBoundary>
    );
  }

  const isAwas =
    effectiveStatus.status.display.awas || effectiveStatus.status.display.level === 'RED';

  return (
    <TvErrorBoundary>
      {isAwas ? (
        <AwasScreen status={effectiveStatus} content={activeContent} />
      ) : (
        <TvLayout
          status={effectiveStatus}
          content={activeContent}
          serverTimeOffsetMs={serverTimeOffsetMs}
        />
      )}
    </TvErrorBoundary>
  );
}
