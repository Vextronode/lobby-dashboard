import { z } from 'zod';
import { isoDateSchema, utcDateTimeSchema } from '../common';
import { cimartProductSchema, cimartSummarySchema } from '../upstream/cimart';
import { sidPopulationSchema, sidServicesSchema } from '../upstream/sid';
import { moduleEnvelopeSchema } from './envelope';

/** Icon names the web client can draw; config maps each SIGAP `condition` to one (F04 R-3). */
export const weatherIconSchema = z.enum([
  'sun',
  'sun-cloud',
  'cloud',
  'fog',
  'drizzle',
  'rain',
  'rain-heavy',
  'storm',
]);

/** One forecast day, already selected and mapped by the aggregator (F04 R-1 to R-4). */
export const weatherDaySchema = z.object({
  /** WIB calendar date. */
  date: isoDateSchema,
  /** 0 = today, 1 = tomorrow, 2 = the day after (WIB); the client turns it into a label (F04 R-2). */
  day_offset: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  condition: z.string(),
  icon: weatherIconSchema,
  temperature_max_c: z.number(),
  rain_probability_pct: z.number().min(0).max(100),
});

/** Earthquake as shown by Lobby (F05, F06). Distance comes from SIGAP, never computed (K-N15). */
export const quakeSchema = z.object({
  magnitude: z.number(),
  /** SIGAP string as-is, e.g. "18 km" (F05 R-3). */
  depth: z.string(),
  location: z.string(),
  distance_to_village_km: z.number(),
  /** Empty string when SIGAP has no potential text (F05 R-7). */
  potential: z.string(),
  /** SIGAP `updatedAt`, used as the event time (F05 R-4). */
  updated_at: utcDateTimeSchema,
});

/** Tag of an item in the combined quake list (F06 R-3). */
export const quakeTagSchema = z.enum(['Jabar', 'Indonesia']);

/** Combined West Java + Indonesia list (F06). `latest-pair` = fallback without paging (F06 R-2). */
export const quakeListSchema = z.object({
  mode: z.enum(['recent', 'latest-pair']),
  items: z.array(quakeSchema.extend({ tag: quakeTagSchema })),
});

/** Evacuation point, ordered and limited by the aggregator (F02 R-6). */
export const evacPointSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
});

/** Emergency contact (institution), `isCore` first, max 4 (F02 R-7). */
export const contactSchema = z.object({ id: z.string(), name: z.string(), phone: z.string() });

export const preparednessSchema = z.object({
  evacuation_points: z.array(evacPointSchema),
  contacts: z.array(contactSchema),
});

/** Thumbnail path served by the aggregator: `/api/lobby/img/<sha256>.webp` (F09 R-8). */
export const lobbyImagePathSchema = z.string().regex(/^\/api\/lobby\/img\/[0-9a-f]{64}\.webp$/);

/** CiMart product with `image_url` replaced by a Lobby thumbnail path (or `null`). */
export const lobbyCimartProductSchema = cimartProductSchema.extend({
  image_url: lobbyImagePathSchema.nullable(),
});

/** CiMart summary as served by Lobby: max 8 products (F09 R-2) and the phase (F09 R-4). */
export const lobbyCimartSchema = cimartSummarySchema.extend({
  featured_products: z.array(lobbyCimartProductSchema).max(8),
  phase: z.union([z.literal(0), z.literal(1)]),
});

export const appLinkIdSchema = z.enum(['sigap', 'sid', 'cimart']);

/** Link card in the "Aplikasi Desa" section (F11 R-5). */
export const appLinkSchema = z.object({ id: appLinkIdSchema, label: z.string(), url: z.url() });

/** `GET /api/lobby/content`. */
export const contentResponseSchema = z.object({
  server_time: utcDateTimeSchema,
  build: z.string(),
  modules: z.object({
    weather: moduleEnvelopeSchema(z.array(weatherDaySchema).max(3)),
    quake_pangandaran: moduleEnvelopeSchema(quakeSchema.nullable()),
    quake_list: moduleEnvelopeSchema(quakeListSchema),
    preparedness: moduleEnvelopeSchema(preparednessSchema),
    sid_population: moduleEnvelopeSchema(sidPopulationSchema),
    sid_services: moduleEnvelopeSchema(sidServicesSchema),
    cimart: moduleEnvelopeSchema(lobbyCimartSchema),
  }),
  static: z.object({
    tips: z.array(z.string()),
    app_links: z.array(appLinkSchema),
    public_url: z.url(),
  }),
});

export type WeatherIcon = z.infer<typeof weatherIconSchema>;
export type WeatherDay = z.infer<typeof weatherDaySchema>;
export type Quake = z.infer<typeof quakeSchema>;
export type QuakeTag = z.infer<typeof quakeTagSchema>;
export type QuakeList = z.infer<typeof quakeListSchema>;
export type EvacPoint = z.infer<typeof evacPointSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Preparedness = z.infer<typeof preparednessSchema>;
export type LobbyCimartProduct = z.infer<typeof lobbyCimartProductSchema>;
export type LobbyCimart = z.infer<typeof lobbyCimartSchema>;
export type AppLinkId = z.infer<typeof appLinkIdSchema>;
export type AppLink = z.infer<typeof appLinkSchema>;
export type ContentResponse = z.infer<typeof contentResponseSchema>;
