import { describe, expect, it } from 'vitest';
import { buildTicker } from '../src/ticker';

describe('F03: buildTicker', () => {
  const sampleTips = [
    'Siapkan tas siaga bencana di dekat pintu keluar.',
    'Kenali jalur evakuasi di lingkungan sekitar Anda.',
    'Simpan nomor telepon darurat di ponsel Anda.',
  ];

  const sampleAnnouncements = [
    {
      title: 'Musyawarah Desa Pembahasan APBDes',
      published_at: '2026-10-16T07:05:00Z',
    },
    {
      title: 'Pelayanan KTP dan KK Keliling',
      published_at: '2026-10-15T02:00:00Z',
    },
  ];

  const sampleEvacPoints = [
    { id: '1', name: 'Balai Desa Cibenda', address: 'Jl. Raya Cibenda No. 1' },
    { id: '2', name: 'Lapangan Sepak Bola', address: null },
    { id: '3', name: 'SD Negeri 1 Cibenda', address: null },
    { id: '4', name: 'Masjid Jami', address: null },
  ];

  it('AC-F03-1: table test of buildTicker across all modes and result is never empty', () => {
    // Mode normal
    const normal = buildTicker({
      mode: 'normal',
      level: 'GREEN',
      reason: 'Tidak ada peringatan aktif',
      announcements: sampleAnnouncements,
      tips: sampleTips,
    });
    expect(normal.length).toBeGreaterThan(0);
    expect(normal).toContain('PENGUMUMAN: Musyawarah Desa Pembahasan APBDes (16 Okt 2026)');
    expect(normal).toContain(sampleTips[0]);

    // Mode priority (YELLOW)
    const priority = buildTicker({
      mode: 'priority',
      level: 'YELLOW',
      reason: 'Waspada gelombang tinggi',
      announcements: sampleAnnouncements,
      tips: sampleTips,
    });
    expect(priority.length).toBeGreaterThan(0);
    expect(priority[0]).toBe('Waspada: Waspada gelombang tinggi');

    // Mode override (ORANGE)
    const overrideOrange = buildTicker({
      mode: 'override',
      level: 'ORANGE',
      reason: 'Potensi banjir rob pesisir',
      announcements: sampleAnnouncements,
      tips: sampleTips,
    });
    expect(overrideOrange).toEqual(['Siaga: Potensi banjir rob pesisir']);

    // Mode override (RED) with evacuation points
    const overrideRed = buildTicker({
      mode: 'override',
      level: 'RED',
      reason: 'Peringatan dini tsunami',
      evacuationPoints: sampleEvacPoints,
      announcements: sampleAnnouncements,
      tips: sampleTips,
    });
    expect(overrideRed).toEqual([
      'Awas: Peringatan dini tsunami',
      'Titik kumpul: Balai Desa Cibenda, Lapangan Sepak Bola, SD Negeri 1 Cibenda',
    ]);

    // With notice (F02 R-4)
    const withNotice = buildTicker({
      mode: 'normal',
      level: 'GREEN',
      notice: 'Status Awas telah dicabut, kini: Aman',
      announcements: sampleAnnouncements,
      tips: sampleTips,
    });
    expect(withNotice[0]).toBe('Status Awas telah dicabut, kini: Aman');
  });

  it('AC-F03-3: orange scenario ticker does not contain announcements nor tips', () => {
    const items = buildTicker({
      mode: 'override',
      level: 'ORANGE',
      reason: 'Siaga angin kencang',
      announcements: sampleAnnouncements,
      tips: sampleTips,
    });
    expect(items).toEqual(['Siaga: Siaga angin kencang']);
    for (const item of items) {
      expect(item).not.toContain('PENGUMUMAN');
      expect(item).not.toContain(sampleTips[0]);
    }
  });

  it('AC-F03-4: yellow scenario ticker has alert item first, then announcements, then tips', () => {
    const items = buildTicker({
      mode: 'priority',
      level: 'YELLOW',
      reason: 'Potensi hujan lebat',
      announcements: sampleAnnouncements,
      tips: sampleTips,
    });
    expect(items[0]).toBe('Waspada: Potensi hujan lebat');
    expect(items[1]).toContain('PENGUMUMAN');
    expect(items[items.length - 1]).toBe(sampleTips[sampleTips.length - 1]);
  });

  it('fallback: if no tips, announcements or reasons, returns alert label so ticker is never empty', () => {
    const empty = buildTicker({
      mode: 'normal',
      level: 'GREEN',
      tips: [],
      announcements: [],
    });
    expect(empty).toEqual(['Aman']);
  });
});
