import { sidServicesSchema, type SidServices } from '@lobby/contract';
import type { FetchResult, UpstreamClient } from '../http-client';

/** `public/lobby/services` (SID-02): letters KPIs + announcements, passed through (F08, F03 R-6). */
export function fetchServices(
  sid: UpstreamClient,
  villageCode: string,
): Promise<FetchResult<SidServices>> {
  return sid.getJson(
    `/api/public/lobby/services?village_code=${encodeURIComponent(villageCode)}`,
    sidServicesSchema,
  );
}
