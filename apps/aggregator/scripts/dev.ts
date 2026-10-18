// Dev entry for `pnpm dev`: loads `dev.env` by absolute path, then starts the aggregator.
// Two Windows quirks under `pnpm --parallel` led to this file: Node's `--env-file=dev.env` reported
// the file as missing, and `tsx watch src/<entry>.ts` never finished loading, while the same code
// started from here works. The root cause is in the tooling, not in the aggregator.
import { fileURLToPath } from 'node:url';

process.loadEnvFile(fileURLToPath(new URL('../dev.env', import.meta.url)));
void import('../src/index');
