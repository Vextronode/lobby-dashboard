import type { QuakeTag, SigapEarthquake } from '@lobby/contract';

const COORDINATE_DECIMALS = 2;

export interface TaggedQuake {
  readonly quake: SigapEarthquake;
  readonly tag: QuakeTag;
}

/**
 * Identity of an event across the two SIGAP scopes (F06 R-4). BMKG has no event ID (audit §2):
 * time + magnitude + coordinates rounded to 2 decimals.
 */
export function quakeKey(quake: SigapEarthquake): string {
  const round = (value: number) => value.toFixed(COORDINATE_DECIMALS);
  return [
    Date.parse(quake.updatedAt),
    quake.magnitude,
    round(quake.coordinates.latitude),
    round(quake.coordinates.longitude),
  ].join('|');
}

/**
 * Combined West Java + Indonesia list (F06 R-3 to R-5): West Java items are tagged "Jabar", the rest
 * "Indonesia"; an event in both appears once as "Jabar"; newest first; at most `limit` items.
 */
export function mergeQuakeLists(
  westJava: readonly SigapEarthquake[],
  indonesia: readonly SigapEarthquake[],
  limit: number,
): TaggedQuake[] {
  const byKey = new Map<string, TaggedQuake>();
  for (const quake of westJava) {
    if (!byKey.has(quakeKey(quake))) byKey.set(quakeKey(quake), { quake, tag: 'Jabar' });
  }
  for (const quake of indonesia) {
    if (!byKey.has(quakeKey(quake))) byKey.set(quakeKey(quake), { quake, tag: 'Indonesia' });
  }
  return [...byKey.values()]
    .sort((a, b) => Date.parse(b.quake.updatedAt) - Date.parse(a.quake.updatedAt))
    .slice(0, limit);
}
