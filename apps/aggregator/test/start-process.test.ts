import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const AGGREGATOR_DIR = fileURLToPath(new URL('..', import.meta.url));
const CONFIG_PATH = fileURLToPath(new URL('../../../config/lobby.config.json', import.meta.url));
const START_TIMEOUT_MS = 30_000;

const workDir = mkdtempSync(join(tmpdir(), 'lobby-config-'));

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function writeConfig(name: string, change: (config: Record<string, unknown>) => void): string {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as Record<string, unknown>;
  change(config);
  const path = join(workDir, name);
  writeFileSync(path, JSON.stringify(config));
  return path;
}

/** Starts the real entry point; with an invalid config it must exit before listening. */
function startAggregator(configPath: string) {
  return spawnSync(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: AGGREGATOR_DIR,
    encoding: 'utf8',
    timeout: START_TIMEOUT_MS,
    env: {
      ...process.env,
      SIGAP_BASE_URL: 'http://localhost:8090/sigap',
      SID_BASE_URL: 'http://localhost:8090/sid',
      CIMART_BASE_URL: 'http://localhost:8090/cimart',
      LOBBY_CONFIG_PATH: configPath,
      PORT: '0',
    },
  });
}

describe('aggregator start with invalid config', () => {
  it.each([
    [
      'AC-4: missing tips',
      'tips',
      (c: Record<string, unknown>) => {
        delete c.tips;
      },
    ],
    [
      'AC-4: interval_s 0',
      'modules.weather.interval_s',
      (c: Record<string, unknown>) => {
        const modules = c.modules as { weather: Record<string, unknown> };
        modules.weather.interval_s = 0;
      },
    ],
  ])(
    '%s → exit code ≠ 0 and message names %s',
    (label, fieldPath, change) => {
      const result = startAggregator(writeConfig(`${label.replace(/\W+/g, '-')}.json`, change));
      expect(result.status).not.toBe(0);
      expect(result.status).not.toBeNull();
      expect(result.stderr).toContain(fieldPath);
    },
    START_TIMEOUT_MS,
  );
});
