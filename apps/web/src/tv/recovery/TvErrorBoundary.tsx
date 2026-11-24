import { Component, type ReactNode } from 'react';
import { copy } from '../../shared/copy/id';

export interface TvErrorBoundaryProps {
  readonly children: ReactNode;
}

interface TvErrorBoundaryState {
  readonly hasError: boolean;
}

const CRASH_STORAGE_KEY = 'lobby_tv_crash_timestamps';
const MAX_RELOADS_PER_HOUR = 3;
const ONE_HOUR_MS = 60 * 60 * 1000;
const RELOAD_DELAY_MS = 10_000;

export class TvErrorBoundary extends Component<TvErrorBoundaryProps, TvErrorBoundaryState> {
  override state: TvErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): TvErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(): void {
    this.scheduleRecoveryReload();
  }

  private scheduleRecoveryReload(): void {
    try {
      const now = Date.now();
      const rawTimestamps = sessionStorage.getItem(CRASH_STORAGE_KEY);
      const timestamps: number[] = rawTimestamps ? (JSON.parse(rawTimestamps) as number[]) : [];
      const recentTimestamps = timestamps.filter((t) => now - t < ONE_HOUR_MS);

      if (recentTimestamps.length < MAX_RELOADS_PER_HOUR) {
        recentTimestamps.push(now);
        sessionStorage.setItem(CRASH_STORAGE_KEY, JSON.stringify(recentTimestamps));

        setTimeout(() => {
          window.location.reload();
        }, RELOAD_DELAY_MS);
      }
    } catch {
      setTimeout(() => {
        window.location.reload();
      }, RELOAD_DELAY_MS);
    }
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '1280px',
            height: '720px',
            backgroundColor: '#090d16',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
            {copy.recovery.restoringTitle}
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {copy.recovery.restoringDescription}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
