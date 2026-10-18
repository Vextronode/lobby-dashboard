import { formatWibTime } from '@lobby/core';
import { MODULE_IDS, type ModuleId } from '../modules/module-data';

// Message texts (F14). Admin texts use everyday words without technical terms (R-6).

/** Upstream systems; source notifications are grouped per system (decision 18 Oct, see LOBBY-02 Laporan). */
export const UPSTREAM_SYSTEMS = ['sigap', 'sid', 'cimart'] as const;
export type UpstreamSystem = (typeof UPSTREAM_SYSTEMS)[number];

export const SYSTEM_OF_MODULE: Readonly<Record<ModuleId, UpstreamSystem>> = {
  status: 'sigap',
  quake_pangandaran: 'sigap',
  quake_list: 'sigap',
  weather: 'sigap',
  preparedness: 'sigap',
  sid_population: 'sid',
  sid_services: 'sid',
  cimart: 'cimart',
};

const SYSTEM_LABEL: Readonly<Record<UpstreamSystem, string>> = {
  sigap: 'SIGAP',
  sid: 'SID',
  cimart: 'CiMart',
};

const CARD_LABEL: Readonly<Record<ModuleId, string>> = {
  status: 'Card status kesiapsiagaan',
  quake_pangandaran: 'Card gempa Pangandaran',
  quake_list: 'Card gempa Jabar/Indonesia',
  weather: 'Card cuaca',
  preparedness: 'Data titik kumpul dan kontak darurat',
  sid_population: 'Card penduduk',
  sid_services: 'Card layanan surat',
  cimart: 'Card CiMart',
};

/** A card whose module is currently failing, with the time of its last good data. */
export interface AffectedCard {
  readonly module: ModuleId;
  readonly fetchedAt: Date | null;
}

/** e.g. "Card penduduk menampilkan data per 08.55; Card layanan surat belum memiliki data." */
function cardsLine(cards: readonly AffectedCard[]): string {
  const ordered = [...cards].sort(
    (a, b) => MODULE_IDS.indexOf(a.module) - MODULE_IDS.indexOf(b.module),
  );
  const parts = ordered.map(({ module, fetchedAt }) =>
    fetchedAt === null
      ? `${CARD_LABEL[module]} belum memiliki data`
      : `${CARD_LABEL[module]} menampilkan data per ${formatWibTime(fetchedAt)}`,
  );
  return `${parts.join('; ')}.`;
}

function deviceName(deviceId: string | null): string {
  return deviceId === null ? 'Layar TV lobby' : `Layar TV lobby (${deviceId})`;
}

export const notificationCopy = {
  /** F14 R-1, e.g. "SID tidak bisa dihubungi sejak 09.05 (5× gagal). Card penduduk menampilkan data per 08.55." */
  systemDown: (
    system: UpstreamSystem,
    since: Date,
    failures: number,
    cards: readonly AffectedCard[],
  ) =>
    `${SYSTEM_LABEL[system]} tidak bisa dihubungi sejak ${formatWibTime(since)} (${String(failures)}× gagal). ${cardsLine(cards)}`,
  /** F14 R-2, every 6 h while still failing. */
  systemStillDown: (system: UpstreamSystem, since: Date, cards: readonly AffectedCard[]) =>
    `${SYSTEM_LABEL[system]} masih tidak bisa dihubungi sejak ${formatWibTime(since)}. ${cardsLine(cards)}`,
  /** F14 R-2, R-5. */
  systemRecovered: (system: UpstreamSystem, at: Date) =>
    `${SYSTEM_LABEL[system]} kembali terhubung pukul ${formatWibTime(at)}. Semua card kembali memakai data terbaru.`,
  /** F14 R-3, e.g. "Layar TV lobby tidak tersambung sejak 09.12. Coba cabut-colok …". */
  deviceDown: (deviceId: string | null, since: Date) =>
    `${deviceName(deviceId)} tidak tersambung sejak ${formatWibTime(since)}. Coba cabut-colok perangkat TV/kiosk dan cek WiFi.`,
  /** F14 R-5. */
  deviceRecovered: (deviceId: string | null, at: Date) =>
    `${deviceName(deviceId)} tersambung kembali ${formatWibTime(at)}.`,
} as const;
