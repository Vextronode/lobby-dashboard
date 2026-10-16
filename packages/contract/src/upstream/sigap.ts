import { z } from 'zod';
import { isoDateSchema, isoDateTimeSchema } from '../common';

// ASSUMPTION: the SIGAP audit (16 Oct) report is not in this repo. Shapes below are inferred from
// SIGAP-01 and specs F01, F02, F04, F05. Objects are loose so unknown SIGAP fields do not fail
// validation; only fields Lobby reads are required. Verify against SIGAP before LOBBY-05.

/** Standard SIGAP success envelope `{ success, message, data }`. */
export function sigapEnvelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), message: z.string(), data });
}

/** Standard SIGAP error envelope `{ success: false, message, errors? }`. */
export const sigapErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.unknown().optional(),
});

/** Where SIGAP took the level from (SIGAP-01 FR-A1). Optional until SIGAP-01 ships. */
export const sigapAlertBasisSchema = z.enum(['record', 'live', 'fallback']);

/**
 * `GET /api/public/alerts/current` data.
 * `level` is any string on purpose: values outside GREEN/YELLOW/ORANGE/RED must become UNKNOWN
 * (F01 R-2), not a schema failure that would keep showing an older level.
 */
export const sigapAlertSchema = z.looseObject({
  id: z.string(),
  level: z.string(),
  description: z.string().nullish(),
  createdAt: isoDateTimeSchema,
  basis: sigapAlertBasisSchema.optional(),
  expired: z.boolean().optional(),
});

// ASSUMPTION: `data: null` is accepted so an empty answer maps to UNKNOWN (F01 R-2) at once.
export const sigapAlertResponseSchema = sigapEnvelopeSchema(sigapAlertSchema.nullable());

/** Scope tag SIGAP may attach to items of `earthquakes/recent` (SIGAP-01 FR-B5, optional). */
export const sigapQuakeScopeSchema = z.enum(['west-java', 'indonesia']);

/** `EarthquakeInfo` (SIGAP `earthquake.types.ts`, example in SIGAP-01). */
export const sigapEarthquakeSchema = z.looseObject({
  magnitude: z.number(),
  depth: z.string(),
  location: z.string(),
  coordinates: z.object({ latitude: z.number(), longitude: z.number() }),
  distanceToVillage: z.number(),
  felt: z.string(),
  potential: z.string(),
  shakemap: z.string(),
  updatedAt: isoDateTimeSchema,
  scopes: z.array(sigapQuakeScopeSchema).optional(),
});

/** `earthquakes/{pangandaran,west-java,indonesia}`: at most one event; `null` = none (F05 R-6). */
export const sigapLatestQuakeResponseSchema = sigapEnvelopeSchema(sigapEarthquakeSchema.nullable());

/** `earthquakes/recent?scope=…&limit=…` (SIGAP-01 §B): list, `[]` when there are none. */
export const sigapRecentQuakesResponseSchema = sigapEnvelopeSchema(z.array(sigapEarthquakeSchema));

/** One daily item of `weather/forecast` (F04, K-N14). `condition` is one of 13 SIGAP values. */
export const sigapWeatherDaySchema = z.looseObject({
  date: isoDateSchema,
  label: z.string().optional(),
  condition: z.string(),
  temperature: z.number(),
  rainProbability: z.number().min(0).max(100),
});

export const sigapWeatherResponseSchema = sigapEnvelopeSchema(z.array(sigapWeatherDaySchema));

/** `evacuation-points` item (F02 R-6). */
export const sigapEvacuationPointSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  address: z.string().nullish(),
  isCore: z.boolean(),
});

export const sigapEvacuationPointsResponseSchema = sigapEnvelopeSchema(
  z.array(sigapEvacuationPointSchema),
);

/** `emergency-contacts` item (F02 R-7): institution name and its public phone number. */
export const sigapEmergencyContactSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  isCore: z.boolean(),
});

export const sigapEmergencyContactsResponseSchema = sigapEnvelopeSchema(
  z.array(sigapEmergencyContactSchema),
);

export type SigapError = z.infer<typeof sigapErrorSchema>;
export type SigapAlertBasis = z.infer<typeof sigapAlertBasisSchema>;
export type SigapAlert = z.infer<typeof sigapAlertSchema>;
export type SigapAlertResponse = z.infer<typeof sigapAlertResponseSchema>;
export type SigapQuakeScope = z.infer<typeof sigapQuakeScopeSchema>;
export type SigapEarthquake = z.infer<typeof sigapEarthquakeSchema>;
export type SigapLatestQuakeResponse = z.infer<typeof sigapLatestQuakeResponseSchema>;
export type SigapRecentQuakesResponse = z.infer<typeof sigapRecentQuakesResponseSchema>;
export type SigapWeatherDay = z.infer<typeof sigapWeatherDaySchema>;
export type SigapWeatherResponse = z.infer<typeof sigapWeatherResponseSchema>;
export type SigapEvacuationPoint = z.infer<typeof sigapEvacuationPointSchema>;
export type SigapEvacuationPointsResponse = z.infer<typeof sigapEvacuationPointsResponseSchema>;
export type SigapEmergencyContact = z.infer<typeof sigapEmergencyContactSchema>;
export type SigapEmergencyContactsResponse = z.infer<typeof sigapEmergencyContactsResponseSchema>;
