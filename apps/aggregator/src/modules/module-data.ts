import {
  lobbyCimartSchema,
  preparednessSchema,
  quakeListSchema,
  quakeSchema,
  sidPopulationSchema,
  sidServicesSchema,
  sigapAlertSchema,
  sigapWeatherDaySchema,
} from '@lobby/contract';
import { z } from 'zod';

/** Modules synced by the aggregator (LOBBY-02 FR-A5), in start order. */
export const MODULE_IDS = [
  'status',
  'quake_pangandaran',
  'quake_list',
  'weather',
  'preparedness',
  'sid_population',
  'sid_services',
  'cimart',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

/** CiMart data as stored after a sync; the phase is decided when read (F09 R-4). */
export const storedCimartSchema = lobbyCimartSchema.omit({ phase: true });

/**
 * Shape each module keeps in the cache and snapshot. Weather stays as SIGAP sent it so "today" is
 * decided at read time and is right just after midnight WIB (F04 R-1).
 */
export const moduleDataSchemas = {
  status: sigapAlertSchema.nullable(),
  quake_pangandaran: quakeSchema.nullable(),
  quake_list: quakeListSchema,
  weather: z.array(sigapWeatherDaySchema),
  preparedness: preparednessSchema,
  sid_population: sidPopulationSchema,
  sid_services: sidServicesSchema,
  cimart: storedCimartSchema,
} as const satisfies Record<ModuleId, z.ZodType>;

export type ModuleData = { [K in ModuleId]: z.infer<(typeof moduleDataSchemas)[K]> };
export type StoredCimart = z.infer<typeof storedCimartSchema>;
