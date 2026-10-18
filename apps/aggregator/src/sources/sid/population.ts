import { sidPopulationSchema, type SidPopulation } from '@lobby/contract';
import type { FetchResult, UpstreamClient } from '../http-client';

/**
 * `public/lobby/population` (SID-01), passed through. SID aggregates and masks; Lobby never
 * recomputes or masks (LOBBY-02 rules). `published: false` is a valid answer (F07 R-1).
 */
export function fetchPopulation(
  sid: UpstreamClient,
  villageCode: string,
): Promise<FetchResult<SidPopulation>> {
  return sid.getJson(
    `/api/public/lobby/population?village_code=${encodeURIComponent(villageCode)}`,
    sidPopulationSchema,
  );
}
