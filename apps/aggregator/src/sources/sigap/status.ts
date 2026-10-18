import { sigapAlertResponseSchema, type SigapAlert } from '@lobby/contract';
import { mapResult, type FetchResult, type UpstreamClient } from '../http-client';

/** `GET /api/public/alerts/current` (F01 R-1). Interpretation happens in the status policy. */
export async function fetchCurrentAlert(
  sigap: UpstreamClient,
): Promise<FetchResult<SigapAlert | null>> {
  const result = await sigap.getJson('/api/public/alerts/current', sigapAlertResponseSchema);
  return mapResult(result, (body) => body.data);
}
