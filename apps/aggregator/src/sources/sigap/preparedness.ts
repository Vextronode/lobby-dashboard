import {
  sigapEmergencyContactsResponseSchema,
  sigapEvacuationPointsResponseSchema,
  type Preparedness,
} from '@lobby/contract';
import { selectEmergencyContacts, selectEvacuationPoints } from '@lobby/core';
import { failure, success, type FetchResult, type UpstreamClient } from '../http-client';

export interface PreparednessOptions {
  readonly evacuationPointIds: readonly string[];
  readonly maxPoints: number;
}

/** Evacuation points + emergency contacts for the Awas screen. Either failing fails the module. */
export async function fetchPreparedness(
  sigap: UpstreamClient,
  options: PreparednessOptions,
): Promise<FetchResult<Preparedness>> {
  const [points, contacts] = await Promise.all([
    sigap.getJson('/api/public/evacuation-points', sigapEvacuationPointsResponseSchema),
    sigap.getJson('/api/public/emergency-contacts', sigapEmergencyContactsResponseSchema),
  ]);
  if (!points.ok) return failure(points.error.kind);
  if (!contacts.ok) return failure(contacts.error.kind);
  return success({
    evacuation_points: selectEvacuationPoints(
      points.value.data,
      options.evacuationPointIds,
      options.maxPoints,
    ).map((point) => ({ id: point.id, name: point.name, address: point.address ?? null })),
    contacts: selectEmergencyContacts(contacts.value.data).map((contact) => ({
      id: contact.id,
      institution: contact.institution,
      phone_number: contact.phoneNumber,
    })),
  });
}
