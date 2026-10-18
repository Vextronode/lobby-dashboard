import { sigapWeatherResponseSchema, type SigapWeatherDay } from '@lobby/contract';
import { mapResult, type FetchResult, type UpstreamClient } from '../http-client';

/** `weather/forecast` (F04). Days are selected when read, see `selectForecastDays`. */
export async function fetchForecast(
  sigap: UpstreamClient,
): Promise<FetchResult<SigapWeatherDay[]>> {
  const result = await sigap.getJson('/api/public/weather/forecast', sigapWeatherResponseSchema);
  return mapResult(result, (body) => body.data);
}
