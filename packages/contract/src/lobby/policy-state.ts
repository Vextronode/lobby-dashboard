import { z } from 'zod';
import { countSchema, utcDateTimeSchema } from '../common';
import { levelSchema, statusNoticeSchema } from './status';

/** A level SIGAP actually reported (never UNKNOWN). */
export const knownLevelSchema = levelSchema.exclude(['UNKNOWN']);

/**
 * State the status policy carries between evaluations. Persisted in the aggregator snapshot so
 * Awas and its exit count survive a restart (F02 R-5).
 */
export const statusPolicyStateSchema = z.object({
  /** Latest raw level from a successful sync (may be UNKNOWN, F01 R-2). */
  last_raw: z
    .object({
      level: levelSchema,
      reason: z.string(),
      alert_created_at: utcDateTimeSchema.nullable(),
    })
    .nullable(),
  /** Latest raw level that was not UNKNOWN, with the time it was observed (F01 R-3). */
  last_known: z
    .object({
      level: knownLevelSchema,
      observed_at: utcDateTimeSchema,
      reason: z.string(),
      alert_created_at: utcDateTimeSchema.nullable(),
    })
    .nullable(),
  /** Non-null while Awas is active (F02). `last_red_at` bounds how long Awas is held (F02 R-3). */
  awas: z
    .object({
      reason: z.string(),
      alert_created_at: utcDateTimeSchema.nullable(),
      last_red_at: utcDateTimeSchema,
    })
    .nullable(),
  /** Consecutive fresh, successful syncs below RED while Awas is active (F02 R-2). */
  calm_syncs: countSchema,
  notice: statusNoticeSchema.nullable(),
});

export type KnownLevel = z.infer<typeof knownLevelSchema>;
export type StatusPolicyState = z.infer<typeof statusPolicyStateSchema>;
