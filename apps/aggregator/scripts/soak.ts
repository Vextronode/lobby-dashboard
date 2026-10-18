// LOBBY-02 AC-6 soak test (manual): runs the aggregator against the in-process mock upstream with
// shortened intervals and prints heap and active timers once per minute.
// Usage: pnpm --filter @lobby/aggregator soak [minutes=120]
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMockApp } from '@lobby/mock-upstream/app';
import { createAggregator } from '../src/aggregator';
import { MODULE_IDS } from '../src/modules/module-data';
import { loadConfig, parseEnv } from '../src/config/load-config';
import { createLogger } from '../src/observability/logger';

const DEFAULT_MINUTES = 120;
const SOAK_INTERVAL_S = 2;
const REPORT_EVERY_MS = 60_000;
const MOCK_ORIGIN = 'http://soak.mock';
const BYTES_PER_MB = 1_048_576;

const minutes = Number(process.argv[2] ?? DEFAULT_MINUTES);
const dataDir = mkdtempSync(join(tmpdir(), 'lobby-soak-'));
const config = loadConfig(
  fileURLToPath(new URL('../../../config/lobby.config.json', import.meta.url)),
);
const env = parseEnv({
  SIGAP_BASE_URL: `${MOCK_ORIGIN}/sigap`,
  SID_BASE_URL: `${MOCK_ORIGIN}/sid`,
  CIMART_BASE_URL: `${MOCK_ORIGIN}/cimart`,
  DATA_DIR: dataDir,
});
if (!config.ok || !env.ok) throw new Error('invalid soak setup');

const fastModules = Object.fromEntries(
  MODULE_IDS.map((id) => [
    id,
    {
      ...config.value.modules[id],
      interval_s: SOAK_INTERVAL_S,
      max_backoff_s: SOAK_INTERVAL_S * 4,
    },
  ]),
) as typeof config.value.modules;

const mock = createMockApp({ scenario: 'normal' });
const aggregator = await createAggregator({
  env: env.value,
  config: { ...config.value, modules: fastModules },
  fetchImpl: (input, init) => Promise.resolve(mock.request(input, init)),
  now: () => new Date(),
  logger: createLogger({ level: 'warn' }),
});
aggregator.start();

const startedAt = Date.now();
const report = setInterval(() => {
  const heapMb = process.memoryUsage().heapUsed / BYTES_PER_MB;
  const timers = process.getActiveResourcesInfo().filter((name) => name === 'Timeout').length;
  const elapsed = Math.round((Date.now() - startedAt) / REPORT_EVERY_MS);
  process.stdout.write(
    `${String(elapsed)} min  heap=${heapMb.toFixed(1)} MB  timers=${String(timers)}\n`,
  );
  void aggregator.app.request('/api/lobby/content');
}, REPORT_EVERY_MS);

setTimeout(() => {
  clearInterval(report);
  void aggregator.stop().then(() => {
    rmSync(dataDir, { recursive: true, force: true });
    process.stdout.write('soak finished\n');
  });
}, minutes * REPORT_EVERY_MS);
