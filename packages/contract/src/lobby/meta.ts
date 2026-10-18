import { z } from 'zod';
import { countSchema, utcDateTimeSchema } from '../common';
import { moduleStateSchema } from './envelope';

/** Per-module health in `/api/lobby/meta` (LOBBY-02 FR-E3). No URLs, env names, or stack traces. */
export const moduleMetaSchema = z.object({
  state: moduleStateSchema,
  fetched_at: utcDateTimeSchema.nullable(),
  last_attempt_at: utcDateTimeSchema.nullable(),
  consecutive_failures: countSchema,
  /** e.g. `timeout`, `network`, `invalid_schema`, `status_502`. */
  last_error_kind: z.string().nullable(),
  last_latency_ms: countSchema.nullable(),
  next_run_at: utcDateTimeSchema.nullable(),
});

/** `GET /api/lobby/meta`. */
export const metaResponseSchema = z.object({
  server_time: utcDateTimeSchema,
  build: z.string(),
  uptime_s: countSchema,
  modules: z.record(z.string(), moduleMetaSchema),
  devices: z.record(z.string(), z.object({ last_seen: utcDateTimeSchema.nullable() })),
});

export type ModuleMeta = z.infer<typeof moduleMetaSchema>;
export type MetaResponse = z.infer<typeof metaResponseSchema>;
