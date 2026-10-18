import type { LobbyConfig } from '../config/config-schema';
import type { Logger } from '../observability/logger';
import { fetchCimartSummary, type ThumbnailProvider } from '../sources/cimart/summary';
import type { FetchResult, UpstreamClient } from '../sources/http-client';
import { fetchPopulation } from '../sources/sid/population';
import { fetchServices } from '../sources/sid/services';
import { fetchPreparedness } from '../sources/sigap/preparedness';
import { fetchPangandaranQuake, fetchQuakeList } from '../sources/sigap/quakes';
import { fetchCurrentAlert } from '../sources/sigap/status';
import { fetchForecast } from '../sources/sigap/weather';
import type { ModuleData, ModuleId } from './module-data';

/** Throttle for the "recent endpoint missing" warning (FR-A5: at most once per hour). */
const RECENT_MISSING_WARN_INTERVAL_MS = 3_600_000;

export interface UpstreamClients {
  readonly sigap: UpstreamClient;
  readonly sid: UpstreamClient;
  readonly cimart: UpstreamClient;
}

export type ModuleFetchers = {
  readonly [K in ModuleId]: () => Promise<FetchResult<ModuleData[K]>>;
};

export interface RegistryDeps {
  readonly config: LobbyConfig;
  readonly clients: UpstreamClients;
  readonly thumbnails: ThumbnailProvider;
  readonly logger: Logger;
  readonly now: () => Date;
}

/** Which upstream each module reads and how its data is shaped (LOBBY-02 FR-A5). */
export function createModuleFetchers(deps: RegistryDeps): ModuleFetchers {
  const { config, clients } = deps;
  let lastRecentMissingWarnAt = Number.NEGATIVE_INFINITY;

  return {
    status: () => fetchCurrentAlert(clients.sigap),
    quake_pangandaran: () => fetchPangandaranQuake(clients.sigap),
    quake_list: () =>
      fetchQuakeList(clients.sigap, {
        mode: config.modules.quake_list.mode,
        limit: config.modules.quake_list.limit,
        onRecentMissing: () => {
          const now = deps.now().getTime();
          if (now - lastRecentMissingWarnAt < RECENT_MISSING_WARN_INTERVAL_MS) return;
          lastRecentMissingWarnAt = now;
          deps.logger.warn(
            { module: 'quake_list', error_kind: 'http_404' },
            'recent quakes endpoint missing, using latest-pair',
          );
        },
      }),
    weather: () => fetchForecast(clients.sigap),
    preparedness: () =>
      fetchPreparedness(clients.sigap, {
        evacuationPointIds: config.awas.evacuation_point_ids,
        maxPoints: config.awas.max_points,
      }),
    sid_population: () => fetchPopulation(clients.sid, config.village_code),
    sid_services: () => fetchServices(clients.sid, config.village_code),
    cimart: () =>
      fetchCimartSummary(
        clients.cimart,
        { maxProducts: config.cimart.max_products, showPhotos: config.cimart.show_photos },
        deps.thumbnails,
      ),
  };
}
