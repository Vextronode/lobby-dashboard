import { z } from 'zod';

/** ISO-8601 timestamp. Upstreams may send `Z` or an explicit offset; Lobby itself always emits UTC. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true });

/** UTC timestamp (`…Z`). Every time Lobby puts on the wire is UTC; WIB is display only. */
export const utcDateTimeSchema = z.iso.datetime();

/** Calendar date `YYYY-MM-DD`. */
export const isoDateSchema = z.iso.date();

/** Non-negative integer count. */
export const countSchema = z.number().int().nonnegative();

/** A count masked at the source when the group is smaller than the suppression threshold (F07 R-5). */
export const suppressedCountSchema = countSchema.nullable();
