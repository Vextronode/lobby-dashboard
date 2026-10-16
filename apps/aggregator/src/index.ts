import { serve } from '@hono/node-server';
import { loadConfig, parseEnv } from './config/load-config';
import { createApp } from './http/app';

const EXIT_INVALID_STARTUP = 1;

function exitWith(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(EXIT_INVALID_STARTUP);
}

const env = parseEnv(process.env);
if (!env.ok) exitWith(env.message);

const config = loadConfig(env.value.LOBBY_CONFIG_PATH);
if (!config.ok) exitWith(config.message);

const server = serve({ fetch: createApp().fetch, port: env.value.PORT }, (info) => {
  process.stdout.write(`aggregator listening on :${String(info.port)}\n`);
});

process.on('SIGTERM', () => {
  server.close();
});
