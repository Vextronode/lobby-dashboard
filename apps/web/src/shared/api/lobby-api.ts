import type { ContentResponse, StatusResponse } from '@lobby/contract';

const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchLobbyStatus(deviceId?: string): Promise<StatusResponse> {
  const query = deviceId ? `?device=${encodeURIComponent(deviceId)}` : '';
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`/api/lobby/status${query}`, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP status failed with ${res.status.toString()}`);
    }
    return (await res.json()) as StatusResponse;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLobbyContent(): Promise<ContentResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch('/api/lobby/content', { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP content failed with ${res.status.toString()}`);
    }
    return (await res.json()) as ContentResponse;
  } finally {
    clearTimeout(timer);
  }
}
