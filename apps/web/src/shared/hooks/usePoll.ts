import { useCallback, useEffect, useState } from 'react';

export interface UsePollOptions<T> {
  readonly fn: () => Promise<T>;
  readonly intervalMs: number;
  readonly pauseWhenHidden?: boolean;
}

export interface UsePollResult<T> {
  readonly data: T | null;
  readonly error: Error | null;
  readonly lastSuccessAt: Date | null;
  readonly isLoading: boolean;
  readonly refetch: () => Promise<void>;
}

export function usePoll<T>({
  fn,
  intervalMs,
  pauseWhenHidden = false,
}: UsePollOptions<T>): UsePollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const execute = useCallback(async () => {
    try {
      const result = await fn();
      setData(result);
      setError(null);
      setLastSuccessAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [fn]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const runLoop = async () => {
      if (pauseWhenHidden && document.hidden) return;
      await execute();
      if (!isCancelled) {
        timer = setTimeout(() => {
          void runLoop();
        }, intervalMs);
      }
    };

    void runLoop();

    const onVisibilityChange = () => {
      if (!document.hidden && pauseWhenHidden) {
        void execute();
      }
    };

    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
      if (pauseWhenHidden) {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [execute, intervalMs, pauseWhenHidden]);

  return {
    data,
    error,
    lastSuccessAt,
    isLoading,
    refetch: execute,
  };
}
