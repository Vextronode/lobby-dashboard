import { appLinkIdSchema, appLinkSchema, weatherIconSchema } from '@lobby/contract';
import { z } from 'zod';

const positiveIntSchema = z.number().int().positive();

/** Sync timing of one module (F12 R-3, R-6). */
const moduleTimingSchema = z.strictObject({
  interval_s: positiveIntSchema,
  max_age_s: positiveIntSchema,
  /** Upper bound of the failure backoff (F12 R-6: 15 min, status 2 min). */
  max_backoff_s: positiveIntSchema,
});

/** Max items SIGAP `earthquakes/recent` accepts (SIGAP-01 FR-B1). */
const QUAKE_LIST_MAX_LIMIT = 15;

/** Minimum number of running text tips (F03 R-7). */
export const MIN_TIPS = 3;

const hhmmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'expected HH:MM (24h, WIB)');

/**
 * `config/lobby.config.json`. Strict objects so a misspelled key fails at start instead of being
 * silently ignored. Defaults in the committed file follow the specs referenced per field.
 */
export const lobbyConfigSchema = z.strictObject({
  village_code: z.string().min(1),
  /** URL encoded in the TV QR code (F11 R-1). */
  public_url: z.url(),
  modules: z.strictObject({
    status: moduleTimingSchema,
    quake_pangandaran: moduleTimingSchema,
    quake_list: moduleTimingSchema.extend({
      mode: z.enum(['recent', 'latest-pair']),
      limit: z.number().int().min(1).max(QUAKE_LIST_MAX_LIMIT),
    }),
    weather: moduleTimingSchema,
    preparedness: moduleTimingSchema,
    sid_population: moduleTimingSchema,
    sid_services: moduleTimingSchema,
    cimart: moduleTimingSchema,
  }),
  /** Data is stale after `stale_factor × interval_s` (F12 R-2). */
  stale_factor: positiveIntSchema,
  awas: z.strictObject({
    /** Manual evacuation point IDs in display order; empty = SIGAP `isCore` points (F02 R-6). */
    evacuation_point_ids: z.array(z.string().min(1)),
    max_points: positiveIntSchema,
    /** Calm syncs in a row needed to leave Awas (F02 R-2). */
    exit_after_syncs: positiveIntSchema,
    /** How long the "Awas dicabut" notice stays (F02 R-4). */
    revoked_notice_minutes: positiveIntSchema,
  }),
  cimart: z.strictObject({
    /** Phase 1 threshold (F09 R-4, K-A8). */
    phase1_min_products: positiveIntSchema,
    max_products: positiveIntSchema,
    show_photos: z.boolean(),
  }),
  /** Exact `condition → icon` map plus `_default` for unknown values (F04 R-3, K-N14). */
  weather_icons: z.object({ _default: weatherIconSchema }).catchall(weatherIconSchema),
  tips: z
    .array(z.string().trim().min(1))
    .min(MIN_TIPS, `at least ${String(MIN_TIPS)} tips required`),
  /** The three "Aplikasi Desa" cards (F11 R-5). */
  app_links: z
    .array(appLinkSchema.strict())
    .length(appLinkIdSchema.options.length)
    .refine((links) => new Set(links.map((link) => link.id)).size === links.length, {
      message: 'app_links ids must be unique',
    }),
  /** Hours in which TV silence is reported (F14 R-4). `days` are ISO weekdays, 1 = Monday. */
  operating_hours: z.strictObject({
    start: hhmmSchema,
    end: hhmmSchema,
    days: z.array(z.number().int().min(1).max(7)).min(1),
  }),
  /** Monitored TV device IDs (F14 R-7). */
  devices: z.array(z.string().min(1)),
});

export type LobbyConfig = z.infer<typeof lobbyConfigSchema>;
