import type { Level } from '@lobby/contract';

/** Resident-facing texts produced by shared logic, in Bahasa Indonesia (guidelines §1.5). */
export const levelLabel: Readonly<Record<Level, string>> = {
  GREEN: 'Aman',
  YELLOW: 'Waspada',
  ORANGE: 'Siaga',
  RED: 'Awas',
  UNKNOWN: 'Data tidak terkini',
};

export const statusCopy = {
  /** F01 R-8, GREEN without a usable description. */
  noActiveAlert: 'Tidak ada peringatan aktif',
  /** F01 R-8, UNKNOWN. */
  unknown: 'Status tidak dapat dipastikan',
  /** F02 R-4. */
  awasRevoked: (current: string) => `Status Awas telah dicabut, kini: ${current}`,
} as const;
