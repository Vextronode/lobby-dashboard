import { z } from 'zod';
import { countSchema, utcDateTimeSchema } from '../common';

/** Module state, computed when a response is built, never stored (F12 R-2). */
export const moduleStateSchema = z.enum(['loading', 'ok', 'stale', 'unavailable']);

/** Envelope fields shared by every module, without `data`. */
export const moduleEnvelopeMetaSchema = z.object({
  state: moduleStateSchema,
  /** Last SUCCESSFUL sync (F12 R-1). */
  fetched_at: utcDateTimeSchema.nullable(),
  /** Seconds since `fetched_at`, computed when the response is built. */
  age_s: countSchema.nullable(),
});

/**
 * Envelope around one module's data.
 * @example moduleEnvelopeSchema(weatherDaySchema.array())
 */
export function moduleEnvelopeSchema<T extends z.ZodType>(data: T) {
  return moduleEnvelopeMetaSchema.extend({ data: data.nullable() });
}

export type ModuleState = z.infer<typeof moduleStateSchema>;
export type ModuleEnvelopeMeta = z.infer<typeof moduleEnvelopeMetaSchema>;
export type ModuleEnvelope<TData> = ModuleEnvelopeMeta & { data: TData | null };
