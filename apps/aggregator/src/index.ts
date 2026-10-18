import { serve } from '@hono/node-server';
import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { createAggregator } from './aggregator';
import { loadConfig, parseEnv } from './config/load-config';
import { createLogger } from './observability/logger';

const EXIT_INVALID_STARTUP = 1;

function exitWith(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(EXIT_INVALID_STARTUP);
}

/** Client IP for rate limiting: last `X-Forwarded-For` hop behind a trusted proxy, else the socket. */
function clientKeyFor(trustProxy: boolean) {
  return (c: Context): string => {
    if (trustProxy) {
      const forwarded = c.req.header('x-forwarded-for')?.split(',').at(-1)?.trim();
      if (forwarded !== undefined && forwarded !== '') return forwarded;
    }
    return getConnInfo(c).remote.address ?? 'unknown';
  };
}

/** Validates env and config, then starts the HTTP server and the scheduler. */
async function main(): Promise<void> {
  const env = parseEnv(process.env);
  if (!env.ok) exitWith(env.message);
  const config = loadConfig(env.value.LOBBY_CONFIG_PATH);
  if (!config.ok) exitWith(config.message);

  const logger = createLogger();
  const aggregator = await createAggregator({
    env: env.value,
    config: config.value,
    fetchImpl: (input, init) => fetch(input, init),
    now: () => new Date(),
    logger,
    clientKey: clientKeyFor(env.value.TRUST_PROXY),
  });

  const server = serve({ fetch: aggregator.app.fetch, port: env.value.PORT }, (info) => {
    logger.info({ port: info.port, build: env.value.BUILD_ID }, 'aggregator listening');
  });
  aggregator.start();

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info({ signal }, 'shutting down');
    // Stop the scheduler, write the last snapshot, then close the server (guidelines §6.3).
    await aggregator.stop();
    server.close();
    logger.flush();
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  process.stderr.write(`aggregator failed to start: ${String(error)}\n`);
  process.exit(EXIT_INVALID_STARTUP);
});
