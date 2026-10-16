import { serve } from '@hono/node-server';
import { createMockApp } from './app';
import { DEFAULT_RED_PHASE_MS, isScenario, SCENARIOS } from './scenarios';

const DEFAULT_PORT = 8090;
const MS_PER_S = 1_000;

const scenario = process.env.MOCK_SCENARIO ?? 'normal';
if (!isScenario(scenario)) {
  process.stderr.write(
    `Unknown MOCK_SCENARIO "${scenario}". Use one of: ${SCENARIOS.join(', ')}\n`,
  );
  process.exit(1);
}

const port = Number(process.env.MOCK_PORT ?? DEFAULT_PORT);
const redPhaseS = process.env.MOCK_RED_PHASE_S;
const redPhaseMs = redPhaseS === undefined ? DEFAULT_RED_PHASE_MS : Number(redPhaseS) * MS_PER_S;

serve({ fetch: createMockApp({ scenario, redPhaseMs }).fetch, port }, (info) => {
  process.stdout.write(`mock-upstream on :${String(info.port)} (scenario: ${scenario})\n`);
});
