import { cimartSummarySchema } from '@lobby/contract';
import type { StoredCimart } from '../../modules/module-data';
import { failure, success, type FetchResult, type UpstreamClient } from '../http-client';

/** Produces a Lobby thumbnail path for a CiMart image URL, or `null` (F09 R-8, R-9). */
export interface ThumbnailProvider {
  thumbnailFor(imageUrl: string): Promise<string | null>;
}

export interface CimartOptions {
  readonly maxProducts: number;
  readonly showPhotos: boolean;
}

/**
 * `api/public/lobby-summary` (CIMART-01): at most `maxProducts` products (F09 R-2), each image
 * replaced by an aggregator thumbnail (F09 R-8). A failed thumbnail never fails the module (FR-D3).
 */
export async function fetchCimartSummary(
  cimart: UpstreamClient,
  options: CimartOptions,
  thumbnails: ThumbnailProvider,
): Promise<FetchResult<StoredCimart>> {
  const result = await cimart.getJson('/api/public/lobby-summary', cimartSummarySchema);
  if (!result.ok) return failure(result.error.kind);

  const featured = result.value.featured_products.slice(0, options.maxProducts);
  const products: StoredCimart['featured_products'] = [];
  // Sequential on purpose: at most 8 small downloads, and only for new URLs (FR-D2).
  for (const product of featured) {
    const imageUrl =
      options.showPhotos && product.image_url !== null
        ? await thumbnails.thumbnailFor(product.image_url)
        : null;
    products.push({ ...product, image_url: imageUrl });
  }
  return success({
    generated_at: result.value.generated_at,
    stats: result.value.stats,
    featured_products: products,
  });
}
