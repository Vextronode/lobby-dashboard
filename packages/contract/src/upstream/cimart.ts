import { z } from 'zod';
import { countSchema, isoDateTimeSchema } from '../common';

// Plain (stripping) objects, as in sid.ts: only whitelisted fields survive parsing (guidelines §2.2).

/** Laravel error body. */
export const cimartErrorSchema = z.object({ message: z.string() });

const namedRefSchema = z.object({ name: z.string(), slug: z.string() });

/** One featured product (CIMART-01 FR-4, F09 R-3). */
export const cimartProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int().nonnegative(),
  unit: z.string().nullable(),
  image_url: z.url().nullable(),
  category: namedRefSchema,
  store: namedRefSchema,
  url: z.url(),
});

/**
 * `GET /api/public/lobby-summary` (CIMART-01 FR-6). CiMart sends at most 10 products (F09 R-1); no
 * `max` here so a longer list is trimmed by Lobby (F09 R-2) instead of failing the whole module.
 */
export const cimartSummarySchema = z.object({
  generated_at: isoDateTimeSchema,
  stats: z.object({ active_stores: countSchema, available_products: countSchema }),
  featured_products: z.array(cimartProductSchema),
});

export type CimartError = z.infer<typeof cimartErrorSchema>;
export type CimartProduct = z.infer<typeof cimartProductSchema>;
export type CimartSummary = z.infer<typeof cimartSummarySchema>;
