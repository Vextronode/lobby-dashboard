import {
  sigapLatestQuakeResponseSchema,
  sigapRecentQuakesResponseSchema,
  type Quake,
  type QuakeList,
  type SigapEarthquake,
  type SigapQuakeScope,
} from '@lobby/contract';
import { mergeQuakeLists } from '@lobby/core';
import { failure, mapResult, success, type FetchResult, type UpstreamClient } from '../http-client';

/** SIGAP earthquake → Lobby wire shape. Distance and depth are passed through (F05 R-2, R-3). */
export function toLobbyQuake(quake: SigapEarthquake): Quake {
  return {
    magnitude: quake.magnitude,
    depth: quake.depth,
    location: quake.location,
    distance_to_village_km: quake.distanceToVillage,
    potential: quake.potential,
    updated_at: new Date(quake.updatedAt).toISOString(),
  };
}

function latestQuake(
  sigap: UpstreamClient,
  path: string,
): Promise<FetchResult<SigapEarthquake | null>> {
  return sigap
    .getJson(path, sigapLatestQuakeResponseSchema)
    .then((result) => mapResult(result, (body) => body.data));
}

/** `earthquakes/pangandaran` (F05 R-1); `null` means no relevant quake (F05 R-6). */
export async function fetchPangandaranQuake(
  sigap: UpstreamClient,
): Promise<FetchResult<Quake | null>> {
  const result = await latestQuake(sigap, '/api/public/earthquakes/pangandaran');
  return mapResult(result, (quake) => (quake === null ? null : toLobbyQuake(quake)));
}

function recentQuakes(
  sigap: UpstreamClient,
  scope: SigapQuakeScope,
  limit: number,
): Promise<FetchResult<SigapEarthquake[]>> {
  return sigap
    .getJson(
      `/api/public/earthquakes/recent?scope=${scope}&limit=${String(limit)}`,
      sigapRecentQuakesResponseSchema,
    )
    .then((result) => mapResult(result, (body) => body.data));
}

function toQuakeList(
  mode: QuakeList['mode'],
  westJava: readonly SigapEarthquake[],
  indonesia: readonly SigapEarthquake[],
  limit: number,
): QuakeList {
  const items = mergeQuakeLists(westJava, indonesia, limit).map(({ quake, tag }) => ({
    ...toLobbyQuake(quake),
    tag,
  }));
  return { mode, items };
}

export interface QuakeListOptions {
  readonly mode: QuakeList['mode'];
  readonly limit: number;
  /** Called when `recent` does not exist yet (404) and the fallback is used (F06 R-2). */
  readonly onRecentMissing: () => void;
}

/**
 * West Java + Indonesia list (F06). `recent` is the main source (SIGAP-01); until it exists, or when
 * config says `latest-pair`, the single latest event of each scope is used without paging (R-2).
 */
export async function fetchQuakeList(
  sigap: UpstreamClient,
  options: QuakeListOptions,
): Promise<FetchResult<QuakeList>> {
  if (options.mode === 'recent') {
    const [westJava, indonesia] = await Promise.all([
      recentQuakes(sigap, 'west-java', options.limit),
      recentQuakes(sigap, 'indonesia', options.limit),
    ]);
    if (westJava.ok && indonesia.ok) {
      return success(toQuakeList('recent', westJava.value, indonesia.value, options.limit));
    }
    const errorKinds = [westJava, indonesia].flatMap((r) => (r.ok ? [] : [r.error.kind]));
    const [firstError = 'network'] = errorKinds;
    if (!errorKinds.includes('http_404')) return failure(firstError);
    options.onRecentMissing();
  }

  const [westJava, indonesia] = await Promise.all([
    latestQuake(sigap, '/api/public/earthquakes/west-java'),
    latestQuake(sigap, '/api/public/earthquakes/indonesia'),
  ]);
  if (!westJava.ok) return failure(westJava.error.kind);
  if (!indonesia.ok) return failure(indonesia.error.kind);
  const asList = (quake: SigapEarthquake | null) => (quake === null ? [] : [quake]);
  return success(
    toQuakeList('latest-pair', asList(westJava.value), asList(indonesia.value), options.limit),
  );
}
