import { z } from 'zod';
import { isoDateSchema, isoDateTimeSchema } from '../common';

// Shapes follow the SIGAP audit of 16 Oct (`docs/task/audit/sigap.md`) plus the fields SIGAP-01 adds.
// Schemas list only the fields Lobby reads. Plain (stripping) objects drop everything else, e.g. the
// alert `reviewer`/`reviewedBy`, so an officer's name can never reach Lobby clients (guidelines §2.3).

/** Standard SIGAP success envelope `{ success, message, data }`. */
export function sigapEnvelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), message: z.string(), data });
}

/**
 * Standard SIGAP error envelope. `errors` is usually `string[]`, but the global 404 handler sends
 * `errors: {}` (audit §6), so it is not narrowed.
 */
export const sigapErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.unknown().optional(),
});

/** Where SIGAP took the level from (SIGAP-01 FR-A1). Optional until SIGAP-01 ships. */
export const sigapAlertBasisSchema = z.enum(['record', 'live', 'fallback']);

/**
 * `GET /api/public/alerts/current` data: always one object, the latest alert (audit §1).
 * `id` is a UUID, `"live-fallback"`, or `"baseline-safe"` (K-N1).
 * `level` is any string on purpose: values outside GREEN/YELLOW/ORANGE/RED must become UNKNOWN
 * (F01 R-2), not a schema failure that would keep showing an older level.
 */
export const sigapAlertSchema = z.object({
  id: z.string(),
  level: z.string(),
  description: z.string().nullish(),
  createdAt: isoDateTimeSchema,
  basis: sigapAlertBasisSchema.optional(),
  expired: z.boolean().optional(),
});

// The audit found no `data: null` path; it is still accepted so an empty answer maps to UNKNOWN
// (F01 R-2) at once instead of failing validation.
export const sigapAlertResponseSchema = sigapEnvelopeSchema(sigapAlertSchema.nullable());

/** Scope tag SIGAP may attach to items of `earthquakes/recent` (SIGAP-01 FR-B5, optional). */
export const sigapQuakeScopeSchema = z.enum(['west-java', 'indonesia']);

/**
 * `EarthquakeInfo` (SIGAP `earthquake.types.ts:37`). Events have no ID (audit §2); `updatedAt` is
 * the BMKG event time in UTC. `felt` and `shakemap` are not read by Lobby.
 */
export const sigapEarthquakeSchema = z.object({
  magnitude: z.number(),
  /** Raw BMKG string, e.g. "18 km". */
  depth: z.string(),
  location: z.string(),
  coordinates: z.object({ latitude: z.number(), longitude: z.number() }),
  /** Whole kilometres from Cibenda, computed by SIGAP (K-N15). */
  distanceToVillage: z.number(),
  potential: z.string(),
  updatedAt: isoDateTimeSchema,
  scopes: z.array(sigapQuakeScopeSchema).optional(),
});

/** `earthquakes/{pangandaran,west-java,indonesia}`: at most one event; `null` = none (F05 R-6). */
export const sigapLatestQuakeResponseSchema = sigapEnvelopeSchema(sigapEarthquakeSchema.nullable());

/** `earthquakes/recent?scope=…&limit=…` (SIGAP-01 §B): list, `[]` when there are none. */
export const sigapRecentQuakesResponseSchema = sigapEnvelopeSchema(z.array(sigapEarthquakeSchema));

/**
 * One daily item of `weather/forecast`: Open-Meteo, 5 days, `Asia/Jakarta` dates (audit §3).
 * `condition` is one of 13 fixed values (K-N14); `label` ("Hari Ini", "Besok", …) is ignored (F04 R-2).
 */
export const sigapWeatherDaySchema = z.object({
  date: isoDateSchema,
  label: z.string().optional(),
  condition: z.string(),
  temperature: z.number(),
  rainProbability: z.number().min(0).max(100),
});

export const sigapWeatherResponseSchema = sigapEnvelopeSchema(z.array(sigapWeatherDaySchema));

/** `evacuation-points` item (F02 R-6). SIGAP orders by `isCore` desc, then `createdAt` asc. */
export const sigapEvacuationPointSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullish(),
  isCore: z.boolean(),
});

export const sigapEvacuationPointsResponseSchema = sigapEnvelopeSchema(
  z.array(sigapEvacuationPointSchema),
);

/** `emergency-contacts` item (F02 R-7): an institution and its public number, no person data. */
export const sigapEmergencyContactSchema = z.object({
  id: z.string(),
  institution: z.string(),
  phoneNumber: z.string(),
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
