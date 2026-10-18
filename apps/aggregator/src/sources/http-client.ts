import type { z } from 'zod';

/** Upstream request timeout (LOBBY-02 NFR-3). */
export const UPSTREAM_TIMEOUT_MS = 8_000;

/** Failure kinds logged per sync (LOBBY-02 NFR-5). */
export type FetchErrorKind = 'timeout' | 'network' | 'invalid_schema' | `http_${string}`;

export interface FetchError {
  readonly kind: FetchErrorKind;
}

export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export type FetchResult<T> = Result<T, FetchError>;

/** `fetch` signature, injectable so tests can route requests to the mock upstream in-process. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function success<T>(value: T): FetchResult<T> {
  return { ok: true, value };
}

export function failure<T>(kind: FetchErrorKind): FetchResult<T> {
  return { ok: false, error: { kind } };
}

/** Transforms the value of a successful result; failures pass through unchanged. */
export function mapResult<T, U>(result: FetchResult<T>, map: (value: T) => U): FetchResult<U> {
  return result.ok ? success(map(result.value)) : result;
}

export interface UpstreamClient {
  /** GETs `path` below the base URL and validates the JSON body. Never throws for expected failures. */
  getJson<T>(path: string, schema: z.ZodType<T>): Promise<FetchResult<T>>;
}

/** Joins without `new URL(path, base)`, which would drop a base path such as `/sigap`. */
function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/**
 * HTTP client for one upstream. Each call has its own timeout and AbortController; there are no
 * retries inside a cycle, retries belong to the scheduler (guidelines §6.2).
 */
export function createUpstreamClient(
  baseUrl: string,
  fetchImpl: FetchLike,
  timeoutMs = UPSTREAM_TIMEOUT_MS,
): UpstreamClient {
  return {
    async getJson<T>(path: string, schema: z.ZodType<T>): Promise<FetchResult<T>> {
      const controller = new AbortController();
      // Rejects on timeout even if a fetch implementation ignores the abort signal.
      const timedOut = new Promise<never>((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('timeout'));
        });
      });
      const timer = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      try {
        const response = await Promise.race([
          fetchImpl(joinUrl(baseUrl, path), {
            signal: controller.signal,
            headers: { accept: 'application/json' },
          }),
          timedOut,
        ]);
        if (!response.ok) {
          await response.body?.cancel();
          return failure(`http_${String(response.status)}`);
        }
        const body: unknown = await response.json().catch(() => undefined);
        const parsed = schema.safeParse(body);
        return parsed.success ? success(parsed.data) : failure('invalid_schema');
      } catch {
        return failure(controller.signal.aborted ? 'timeout' : 'network');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
