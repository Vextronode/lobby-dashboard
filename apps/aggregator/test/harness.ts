import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMockApp } from '@lobby/mock-upstream/app';
import type { Scenario } from '@lobby/mock-upstream/scenarios';
import { createAggregator, type Aggregator } from '../src/aggregator';
import type { LobbyConfig } from '../src/config/config-schema';
import { parseConfig, parseEnv } from '../src/config/load-config';
import type { Env } from '../src/config/env-schema';
import type { Notifier } from '../src/notify/notifier';
import { createLogger } from '../src/observability/logger';
import type { FetchLike } from '../src/sources/http-client';

export const MOCK_ORIGIN = 'http://mock.test';
export const T0 = new Date('2026-11-02T03:00:00Z'); // Monday 10.00 WIB

const CONFIG_PATH = fileURLToPath(new URL('../../../config/lobby.config.json', import.meta.url));

export const silentLogger = createLogger({ level: 'silent' });

export function testConfig(change: (config: LobbyConfig) => LobbyConfig = (c) => c): LobbyConfig {
  const parsed = parseConfig(JSON.parse(readFileSync(CONFIG_PATH, 'utf8')), 'test');
  if (!parsed.ok) throw new Error(parsed.message);
  return change(parsed.value);
}

export function testEnv(dataDir: string, overrides: Record<string, string> = {}): Env {
  const parsed = parseEnv({
    SIGAP_BASE_URL: `${MOCK_ORIGIN}/sigap`,
    SID_BASE_URL: `${MOCK_ORIGIN}/sid`,
    CIMART_BASE_URL: `${MOCK_ORIGIN}/cimart`,
    DATA_DIR: dataDir,
    BUILD_ID: 'test-build',
    ...overrides,
  });
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.value;
}

/** Controllable clock shared by the aggregator and the mock. */
export class TestClock {
  private current: number;

  constructor(start: Date = T0) {
    this.current = start.getTime();
  }

  readonly now = (): Date => new Date(this.current);

  advance(ms: number): void {
    this.current += ms;
  }
}

export function tempDataDir(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'lobby-agg-'));
  return {
    dir,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export interface HarnessOptions {
  readonly scenario?: Scenario;
  readonly config?: LobbyConfig;
  readonly dataDir?: string;
  readonly clock?: TestClock;
  readonly notifier?: Notifier;
  /** Replaces the mock for selected URLs (return undefined to fall through). */
  readonly intercept?: (url: string) => Response | undefined;
}

export interface Harness {
  readonly aggregator: Aggregator;
  readonly clock: TestClock;
  readonly dataDir: string;
  /** Every URL requested from upstreams (mock + intercepted). */
  readonly requests: string[];
  setScenario(scenario: Scenario): Promise<void>;
  get(path: string, init?: RequestInit): Promise<Response>;
  json<T>(path: string): Promise<T>;
  close(): Promise<void>;
}

/** Aggregator wired to the mock upstream in-process: no network, fake clock. */
export async function createHarness(options: HarnessOptions = {}): Promise<Harness> {
  const clock = options.clock ?? new TestClock();
  const temp = options.dataDir === undefined ? tempDataDir() : null;
  const dataDir = options.dataDir ?? temp?.dir ?? '';
  const mock = createMockApp({
    scenario: options.scenario ?? 'normal',
    now: clock.now,
    sleep: () => new Promise<void>(() => undefined), // `slow` never answers: the client times out
  });
  const requests: string[] = [];
  const fetchImpl: FetchLike = async (input, init) => {
    requests.push(input);
    const intercepted = options.intercept?.(input);
    if (intercepted !== undefined) return intercepted;
    if (!input.startsWith(MOCK_ORIGIN)) throw new Error(`unexpected request to ${input}`);
    return mock.request(input, init);
  };
  const aggregator = await createAggregator({
    env: testEnv(dataDir),
    config: options.config ?? testConfig(),
    fetchImpl,
    now: clock.now,
    logger: silentLogger,
    ...(options.notifier === undefined ? {} : { notifier: options.notifier }),
  });

  return {
    aggregator,
    clock,
    dataDir,
    requests,
    async setScenario(scenario) {
      await mock.request(`/__scenario/${scenario}`);
    },
    get: (path, init) => Promise.resolve(aggregator.app.request(path, init)),
    async json<T>(path: string) {
      return (await (await aggregator.app.request(path)).json()) as T;
    },
    async close() {
      await aggregator.stop();
      temp?.cleanup();
    },
  };
}
