import { z } from 'zod';
import { utcDateTimeSchema } from '../common';
import { moduleEnvelopeSchema } from './envelope';

/** Display level. `UNKNOWN` is never shown as safe (F01). */
export const levelSchema = z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED', 'UNKNOWN']);

/** Running text mode (F03 R-1). */
export const tickerModeSchema = z.enum(['normal', 'priority', 'override']);

/** Temporary running text notice, e.g. Awas revoked (K-A19, F02 R-4). */
export const statusNoticeSchema = z.object({ text: z.string(), until: utcDateTimeSchema });

/** Status after the F01/F02/F03 policy has been applied. */
export const statusDisplaySchema = z.object({
  /** Level that is DISPLAYED (after policy). */
  level: levelSchema,
  /** Last raw level received from SIGAP. */
  source_level: levelSchema.nullable(),
  /** Text for the status card and running text. */
  reason: z.string(),
  alert_created_at: utcDateTimeSchema.nullable(),
  /** true = level ≥ ORANGE kept although data is stale (K-A5, F01 R-5). */
  stale_hold: z.boolean(),
  /** Full-screen mode on TV, banner on mobile (F02). */
  awas: z.boolean(),
  ticker_mode: tickerModeSchema,
  notice: statusNoticeSchema.nullable(),
  /** For the "Terakhir diperbarui HH.MM" label. */
  last_updated_at: utcDateTimeSchema.nullable(),
});

/** `GET /api/lobby/status`. */
export const statusResponseSchema = z.object({
  server_time: utcDateTimeSchema,
  build: z.string(),
  status: moduleEnvelopeSchema(z.unknown()).extend({ display: statusDisplaySchema }),
});

export type Level = z.infer<typeof levelSchema>;
export type TickerMode = z.infer<typeof tickerModeSchema>;
export type StatusNotice = z.infer<typeof statusNoticeSchema>;
export type StatusDisplay = z.infer<typeof statusDisplaySchema>;
export type StatusResponse = z.infer<typeof statusResponseSchema>;
