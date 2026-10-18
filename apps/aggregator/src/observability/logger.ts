import { pino, type DestinationStream, type Logger } from 'pino';

export type { Logger } from 'pino';

const STDOUT_FD = 1;

/**
 * Structured JSON logger: one event per line, consistent fields (`module`, `latency_ms`,
 * `error_kind`). Never log upstream payloads, URLs with secrets, or env values (guidelines §6.4).
 *
 * Writes to stdout asynchronously: synchronous writes can spin forever on a busy pipe on Windows
 * (seen under `pnpm --parallel` + `tsx watch`). Call `logger.flush()` before exiting.
 */
export function createLogger(
  options: { level?: string; destination?: DestinationStream } = {},
): Logger {
  return pino(
    { level: options.level ?? 'info', base: { service: 'lobby-aggregator' } },
    options.destination ?? pino.destination({ dest: STDOUT_FD, sync: false }),
  );
}
