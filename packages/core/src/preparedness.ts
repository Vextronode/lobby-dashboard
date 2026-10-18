import type { SigapEmergencyContact, SigapEvacuationPoint } from '@lobby/contract';

/** Contacts shown on the Awas screen (F02 R-7). */
export const MAX_EMERGENCY_CONTACTS = 4;

/**
 * Evacuation points for the Awas screen (F02 R-6, K-A7): the configured IDs in config order, or, when
 * none are configured, SIGAP's `isCore` points in SIGAP order; at most `maxPoints`. No distances.
 */
export function selectEvacuationPoints(
  points: readonly SigapEvacuationPoint[],
  configuredIds: readonly string[],
  maxPoints: number,
): SigapEvacuationPoint[] {
  const selected =
    configuredIds.length > 0
      ? configuredIds.flatMap((id) => points.filter((point) => point.id === id).slice(0, 1))
      : points.filter((point) => point.isCore);
  return selected.slice(0, maxPoints);
}

/** Emergency contacts, `isCore` first (stable), at most 4 (F02 R-7). */
export function selectEmergencyContacts(
  contacts: readonly SigapEmergencyContact[],
): SigapEmergencyContact[] {
  return [...contacts.filter((c) => c.isCore), ...contacts.filter((c) => !c.isCore)].slice(
    0,
    MAX_EMERGENCY_CONTACTS,
  );
}
