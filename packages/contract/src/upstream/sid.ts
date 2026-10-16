import { z } from 'zod';
import { countSchema, isoDateSchema, isoDateTimeSchema, suppressedCountSchema } from '../common';

// SID responses use plain objects (not loose): unknown keys are stripped during parsing, so a field
// SID adds by mistake can never reach Lobby clients (guidelines §2.2).

/** Laravel error body. */
export const sidErrorSchema = z.object({ message: z.string() });

/** `GET /api/public/lobby/population` while the publish flag is off (F07 R-1, SID-01). */
export const sidPopulationUnpublishedSchema = z.object({
  published: z.literal(false),
  generated_at: isoDateTimeSchema,
});

/**
 * `GET /api/public/lobby/population` when published (SID-01 contract, F07 R-3 to R-12).
 * Totals and male/female are never masked (F07 R-5); group counts may be `null` (< 10).
 */
export const sidPopulationPublishedSchema = z.object({
  published: z.literal(true),
  generated_at: isoDateTimeSchema,
  as_of: isoDateTimeSchema.nullable(),
  suppression_threshold: z.number().int().positive(),
  population: z.object({
    total: countSchema,
    male: countSchema,
    female: countSchema,
    households: countSchema,
  }),
  age_pyramid: z.object({
    bucket_years: z.number().int().positive(),
    buckets: z.array(
      z.object({ label: z.string(), male: suppressedCountSchema, female: suppressedCountSchema }),
    ),
  }),
  occupations: z.object({
    top: z.array(z.object({ name: z.string(), count: countSchema })).max(5),
    // ASSUMPTION: SID-01 example shows numbers; nullable in case SID masks small remainders.
    others_count: suppressedCountSchema,
    non_working_count: suppressedCountSchema,
    unfilled_count: suppressedCountSchema,
  }),
  hamlets: z.object({
    items: z.array(z.object({ name: z.string(), count: suppressedCountSchema })),
    unassigned_count: suppressedCountSchema,
  }),
});

export const sidPopulationSchema = z.discriminatedUnion('published', [
  sidPopulationUnpublishedSchema,
  sidPopulationPublishedSchema,
]);

/** Number of weekly buckets in the letters trend (F08 R-5). */
export const LETTER_TREND_WEEKS = 12;

/** `GET /api/public/lobby/services` (SID-02 contract, F08, F03 R-6). */
export const sidServicesSchema = z.object({
  generated_at: isoDateTimeSchema,
  letters: z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    submitted: countSchema,
    completed: countSchema,
    in_process: countSchema,
    weekly: z
      .array(
        z.object({ week_start: isoDateSchema, submitted: countSchema, completed: countSchema }),
      )
      .length(LETTER_TREND_WEEKS),
    top_types: z.array(z.object({ code: z.string(), name: z.string(), count: countSchema })).max(5),
  }),
  announcements: z
    .array(z.object({ id: z.string(), title: z.string(), published_at: isoDateTimeSchema }))
    .max(5),
});

export type SidError = z.infer<typeof sidErrorSchema>;
export type SidPopulationUnpublished = z.infer<typeof sidPopulationUnpublishedSchema>;
export type SidPopulationPublished = z.infer<typeof sidPopulationPublishedSchema>;
export type SidPopulation = z.infer<typeof sidPopulationSchema>;
export type SidServices = z.infer<typeof sidServicesSchema>;
