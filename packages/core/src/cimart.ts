import type { ModuleState } from '@lobby/contract';

/**
 * CiMart showcase phase (F09 R-4, K-A8): 1 when the module has data (`ok` or `stale`) and at least
 * `minProducts` products, otherwise 0 (call-to-action slides).
 */
export function cimartPhase(state: ModuleState, productCount: number, minProducts: number): 0 | 1 {
  const hasData = state === 'ok' || state === 'stale';
  return hasData && productCount >= minProducts ? 1 : 0;
}
