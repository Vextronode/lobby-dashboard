import { countSchema, utcDateTimeSchema } from '@lobby/contract';
import { z } from 'zod';
import { MODULE_IDS, type ModuleData, type ModuleId } from '../modules/module-data';

/** Bookkeeping kept next to each module's data (LOBBY-02 FR-C1). */
export const cacheEntryMetaSchema = z.object({
  /** Last SUCCESSFUL sync (F12 R-1). */
  fetched_at: utcDateTimeSchema.nullable(),
  last_attempt_at: utcDateTimeSchema.nullable(),
  consecutive_failures: countSchema,
  /** Start of the current failure streak, for "sejak HH.MM" in notifications (F14 R-1). */
  first_failure_at: utcDateTimeSchema.nullable(),
  last_error_kind: z.string().nullable(),
  last_latency_ms: countSchema.nullable(),
});

export type CacheEntryMeta = z.infer<typeof cacheEntryMetaSchema>;
export type CacheEntry<T> = CacheEntryMeta & { readonly data: T | null };
export type ModuleEntries = { [K in ModuleId]: CacheEntry<ModuleData[K]> };
/** Entries restored from a snapshot; any module may be missing. */
export type PartialModuleEntries = { [K in ModuleId]?: CacheEntry<ModuleData[K]> | undefined };

export function cacheEntrySchema<T extends z.ZodType>(data: T) {
  return cacheEntryMetaSchema.extend({ data: data.nullable() });
}

export function emptyEntry<T>(): CacheEntry<T> {
  return {
    data: null,
    fetched_at: null,
    last_attempt_at: null,
    consecutive_failures: 0,
    first_failure_at: null,
    last_error_kind: null,
    last_latency_ms: null,
  };
}

/** Last result per module. An interface so a KV store can replace memory later (K-A1 §3.1). */
export interface CacheStore {
  get<K extends ModuleId>(module: K): CacheEntry<ModuleData[K]>;
  set<K extends ModuleId>(module: K, entry: CacheEntry<ModuleData[K]>): void;
  all(): Readonly<ModuleEntries>;
}

export class MemoryCacheStore implements CacheStore {
  private readonly entries: ModuleEntries;

  constructor(
    initial: PartialModuleEntries = {},
    private readonly onChange: () => void = () => undefined,
  ) {
    const entries: PartialModuleEntries = {};
    for (const id of MODULE_IDS) {
      Object.assign(entries, { [id]: initial[id] ?? emptyEntry() });
    }
    this.entries = entries as ModuleEntries;
  }

  get<K extends ModuleId>(module: K): CacheEntry<ModuleData[K]> {
    return this.entries[module];
  }

  set<K extends ModuleId>(module: K, entry: CacheEntry<ModuleData[K]>): void {
    Object.assign(this.entries, { [module]: entry });
    this.onChange();
  }

  all(): Readonly<ModuleEntries> {
    return { ...this.entries };
  }
}
