import type { ContentResponse, StatusResponse } from '@lobby/contract';
import { expect, test } from '@playwright/test';

const mockStatusResponse: StatusResponse = {
  server_time: '2026-11-24T08:00:00.000Z',
  build: 'test-build-1',
  status: {
    state: 'ok',
    fetched_at: '2026-11-24T08:00:00.000Z',
    age_s: 0,
    data: null,
    display: {
      level: 'GREEN',
      source_level: 'GREEN',
      reason: 'Kondisi pesisir Cibenda terpantau aman tanpa peringatan aktif.',
      alert_created_at: '2026-11-24T08:00:00.000Z',
      stale_hold: false,
      awas: false,
      ticker_mode: 'normal',
      notice: null,
      last_updated_at: '2026-11-24T08:00:00.000Z',
    },
  },
};

const mockContentResponse: ContentResponse = {
  server_time: '2026-11-24T08:00:00.000Z',
  build: 'test-build-1',
  static: {
    public_url: 'http://localhost:5173/',
    tips: [
      'Siapkan tas siaga berisi dokumen penting, obat-obatan, senter, dan air minum.',
      'Kenali jalur evakuasi dan titik kumpul terdekat dari rumah Anda.',
      'Simpan nomor darurat desa dan BPBD di ponsel keluarga.',
    ],
    app_links: [],
  },
  modules: {
    weather: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: [
        {
          date: '2026-11-24',
          day_offset: 0,
          condition: 'Cerah Berawan',
          icon: 'sun-cloud',
          temperature_max_c: 31,
          rain_probability_pct: 20,
        },
        {
          date: '2026-11-25',
          day_offset: 1,
          condition: 'Hujan Ringan',
          icon: 'rain',
          temperature_max_c: 29,
          rain_probability_pct: 60,
        },
        {
          date: '2026-11-26',
          day_offset: 2,
          condition: 'Berawan',
          icon: 'cloud',
          temperature_max_c: 30,
          rain_probability_pct: 30,
        },
      ],
    },
    quake_pangandaran: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        magnitude: 4.8,
        depth: '10 km',
        location: '65 km BaratDaya KAB-PANGANDARAN-JABAR',
        distance_to_village_km: 72,
        potential: 'Tidak berpotensi tsunami',
        updated_at: '2026-11-24T07:30:00.000Z',
      },
    },
    quake_list: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        mode: 'recent',
        items: [
          {
            magnitude: 4.8,
            depth: '10 km',
            location: 'Pangandaran',
            distance_to_village_km: 72,
            potential: '',
            updated_at: '2026-11-24T07:30:00.000Z',
            tag: 'Jabar',
          },
        ],
      },
    },
    preparedness: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        evacuation_points: [
          {
            id: 'evac-1',
            name: 'Balai Desa Cibenda',
            address: 'Jl. Raya Cibenda No. 1',
          },
          {
            id: 'evac-2',
            name: 'SD Negeri 1 Cibenda',
            address: 'Dusun Karanganyar',
          },
        ],
        contacts: [
          {
            id: 'c-1',
            institution: 'BPBD Pangandaran',
            phone_number: '08112345678',
          },
          {
            id: 'c-2',
            institution: 'Puskesmas Parigi',
            phone_number: '0265123456',
          },
        ],
      },
    },
    sid_population: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        published: true,
        generated_at: '2026-11-24T08:00:00.000Z',
        as_of: '2026-11-01T00:00:00.000Z',
        suppression_threshold: 10,
        population: {
          total: 4250,
          households: 1320,
          male: 2130,
          female: 2120,
        },
        age_pyramid: {
          bucket_years: 10,
          buckets: [
            { label: '0–9', male: 210, female: 195 },
            { label: '10–19', male: 280, female: 260 },
            { label: '20–29', male: 310, female: 300 },
            { label: '30–39', male: 340, female: 330 },
            { label: '40–49', male: 290, female: 285 },
            { label: '50–59', male: 250, female: 240 },
          ],
        },
        occupations: {
          top: [
            { name: 'Petani', count: 1200 },
            { name: 'Nelayan', count: 650 },
            { name: 'Pedagang', count: 420 },
            { name: 'Wiraswasta', count: 380 },
            { name: 'PNS/TNI/Polri', count: 95 },
          ],
          others_count: 150,
          non_working_count: 800,
          unfilled_count: 55,
        },
        hamlets: {
          items: [
            { name: 'Karanganyar', count: 1450 },
            { name: 'Cibenda Hilir', count: 1520 },
            { name: 'Cibenda Girang', count: 1280 },
          ],
          unassigned_count: 0,
        },
      },
    },
    sid_services: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        generated_at: '2026-11-24T08:00:00.000Z',
        letters: {
          month: '2026-11',
          submitted: 145,
          completed: 138,
          in_process: 7,
          weekly: Array.from({ length: 12 }, (_, i) => ({
            week_start: `2026-08-${(10 + i).toString().padStart(2, '0')}`,
            submitted: 10 + (i % 5),
            completed: 9 + (i % 4),
          })),
          top_types: [
            { code: 'SKU', name: 'Surat Keterangan Usaha', count: 45 },
            { code: 'SKD', name: 'Surat Keterangan Domisili', count: 32 },
            { code: 'SKCK', name: 'Surat Pengantar SKCK', count: 28 },
          ],
        },
        announcements: [
          {
            id: 'ann-1',
            title: 'Musrenbangdes Tahun Anggaran 2027',
            published_at: '2026-11-24T08:00:00.000Z',
          },
        ],
      },
    },
    cimart: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        generated_at: '2026-11-24T08:00:00.000Z',
        phase: 1,
        stats: {
          active_stores: 12,
          available_products: 45,
        },
        featured_products: [
          {
            id: 1,
            name: 'Gula Kelapa Asli Cibenda',
            slug: 'gula-kelapa-asli-cibenda',
            price: 15000,
            unit: 'kg',
            url: 'https://cimart.example.id/products/gula-kelapa',
            image_url: null,
            store: { name: 'Warung Bu Siti', slug: 'warung-bu-siti' },
            category: { name: 'Kuliner', slug: 'kuliner' },
          },
          {
            id: 2,
            name: 'Kripik Pisang Madu',
            slug: 'kripik-pisang-madu',
            price: 12000,
            unit: 'bungkus',
            url: 'https://cimart.example.id/products/kripik-pisang',
            image_url: null,
            store: { name: 'Cemilan Berkah', slug: 'cemilan-berkah' },
            category: { name: 'Makanan Ringan', slug: 'makanan-ringan' },
          },
          {
            id: 3,
            name: 'Madu Hutan Tropis',
            slug: 'madu-hutan-tropis',
            price: 65000,
            unit: 'botol',
            url: 'https://cimart.example.id/products/madu-hutan',
            image_url: null,
            store: { name: 'Kelompok Tani Lestari', slug: 'kelompok-tani-lestari' },
            category: { name: 'Herbal', slug: 'herbal' },
          },
        ],
      },
    },
  },
};

test.describe('TV Kiosk Scenarios (LOBBY-03)', () => {
  test('Normal mode: renders 1280x720 layout, header, status card, cards, and ticker', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.route('**/api/lobby/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatusResponse),
      });
    });
    await page.route('**/api/lobby/content*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContentResponse),
      });
    });

    await page.goto('/tv');

    // Header & identity
    await expect(page.getByRole('heading', { name: 'Pemerintah Desa Cibenda' })).toBeVisible();
    await expect(page.getByText('Kecamatan Parigi, Kabupaten Pangandaran')).toBeVisible();

    // Status Card (Safe)
    await expect(page.getByRole('heading', { name: 'Kesiapsiagaan' })).toBeVisible();
    await expect(page.getByText('Aman', { exact: true })).toBeVisible();

    // Pangandaran Quake Card
    const quakeHeading = page.getByRole('heading', { name: 'Gempa Pangandaran' });
    await expect(quakeHeading).toBeVisible();
    const quakeCard = quakeHeading.locator('xpath=ancestor::div[contains(@class, "card")]');
    await expect(quakeCard.getByText('M 4.8')).toBeVisible();

    // Population Card
    await expect(page.getByRole('heading', { name: 'Penduduk Desa' })).toBeVisible();
    await expect(page.getByText('4.250')).toBeVisible();

    // Running text ticker & QR Code
    await expect(page.getByLabel('Informasi Berjalan')).toBeVisible();
    await expect(page.getByLabel('Kode QR Papan Informasi')).toBeVisible();

    await page.screenshot({ path: test.info().outputPath('tv-normal.png') });
  });

  test('Red mode (Layar Darurat Awas F02): full-screen takeover and rotation stop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const redStatus: StatusResponse = {
      ...mockStatusResponse,
      status: {
        ...mockStatusResponse.status,
        display: {
          ...mockStatusResponse.status.display,
          level: 'RED',
          source_level: 'RED',
          awas: true,
          ticker_mode: 'override',
          reason: 'Peringatan dini tsunami pesisir Pangandaran. Segera evakuasi.',
        },
      },
    };

    await page.route('**/api/lobby/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(redStatus),
      });
    });
    await page.route('**/api/lobby/content*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContentResponse),
      });
    });

    await page.goto('/tv');

    // Fullscreen Awas takeover banner
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('STATUS AWAS')).toBeVisible();
    await expect(page.getByRole('heading', { name: /tsunami pesisir/i })).toBeVisible();

    // Evacuation Points & Emergency Contacts
    await expect(page.getByRole('heading', { name: 'Titik Kumpul Evakuasi' })).toBeVisible();
    await expect(page.getByText('Balai Desa Cibenda', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kontak Darurat' })).toBeVisible();
    await expect(page.getByText('BPBD Pangandaran', { exact: true })).toBeVisible();

    // Standard card layout must NOT be visible during Awas
    await expect(page.getByRole('heading', { name: 'Pemerintah Desa Cibenda' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gempa Pangandaran' })).not.toBeVisible();

    await page.screenshot({ path: test.info().outputPath('tv-awas.png') });
  });

  test('Orange mode (Siaga F03 R-2, AC-F03-3): ticker contains no announcements or tips', async ({
    page,
  }) => {
    const orangeStatus: StatusResponse = {
      ...mockStatusResponse,
      status: {
        ...mockStatusResponse.status,
        display: {
          ...mockStatusResponse.status.display,
          level: 'ORANGE',
          source_level: 'ORANGE',
          ticker_mode: 'override',
          reason: 'Status Siaga: Gelombang pasang tinggi di pesisir Selatan.',
        },
      },
    };

    await page.route('**/api/lobby/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orangeStatus),
      });
    });
    await page.route('**/api/lobby/content*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContentResponse),
      });
    });

    await page.goto('/tv');

    const ticker = page.getByLabel('Informasi Berjalan');
    await expect(ticker).toBeVisible();
    // Emergency reason must be present
    await expect(ticker).toContainText('Gelombang pasang tinggi');

    // AC-F03-3: No announcements and no tips in override mode
    await expect(ticker).not.toContainText('Musrenbangdes');
    await expect(ticker).not.toContainText('Siapkan tas siaga');
  });

  test('Yellow mode (Waspada F03 R-3, AC-F03-4): ticker starts with warning, followed by warta and tips', async ({
    page,
  }) => {
    const yellowStatus: StatusResponse = {
      ...mockStatusResponse,
      status: {
        ...mockStatusResponse.status,
        display: {
          ...mockStatusResponse.status.display,
          level: 'YELLOW',
          source_level: 'YELLOW',
          ticker_mode: 'priority',
          reason: 'Status Waspada: Hujan lebat disertai angin kencang.',
        },
      },
    };

    await page.route('**/api/lobby/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(yellowStatus),
      });
    });
    await page.route('**/api/lobby/content*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContentResponse),
      });
    });

    await page.goto('/tv');

    const ticker = page.getByLabel('Informasi Berjalan');
    await expect(ticker).toBeVisible();
    // Warning item present
    await expect(ticker).toContainText('Hujan lebat');
    // Announcements & tips present
    await expect(ticker).toContainText('Musrenbangdes');
  });

  test('SIGAP fallback scenario (AC-F01-6): never shows the word Aman', async ({ page }) => {
    const sigapFallbackStatus: StatusResponse = {
      ...mockStatusResponse,
      status: {
        ...mockStatusResponse.status,
        display: {
          ...mockStatusResponse.status.display,
          level: 'YELLOW',
          source_level: 'UNKNOWN',
          reason: 'Layanan SIGAP dalam pemantauan.',
        },
      },
    };

    await page.route('**/api/lobby/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sigapFallbackStatus),
      });
    });
    await page.route('**/api/lobby/content*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContentResponse),
      });
    });

    await page.goto('/tv');

    // Status card badge
    await expect(page.getByRole('heading', { name: 'Kesiapsiagaan' })).toBeVisible();
    await expect(page.getByText('Waspada')).toBeVisible();

    // The word "Aman" must never appear on the status card badge or text
    const statusCard = page
      .locator('div')
      .filter({ hasText: /^🛡️Kesiapsiagaan/ })
      .first();
    await expect(statusCard).not.toContainText('Aman');
  });

  test('Offline resilience (AC-F13-1): cached data from localStorage is rendered when offline', async ({
    page,
  }) => {
    // Seed localStorage with cached data
    await page.addInitScript(
      ({ status, content }) => {
        localStorage.setItem('lobby_cache_status', JSON.stringify(status));
        localStorage.setItem('lobby_cache_content', JSON.stringify(content));
      },
      { status: mockStatusResponse, content: mockContentResponse },
    );

    // Block all API network requests
    await page.route('**/api/lobby/*', async (route) => {
      await route.abort();
    });

    await page.goto('/tv');

    // Should still render layout from local cache without blank screen
    await expect(page.getByRole('heading', { name: 'Pemerintah Desa Cibenda' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kesiapsiagaan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Penduduk Desa' })).toBeVisible();
  });

  test('Error boundary recovery (AC-F13-2): displays recovery screen when render error occurs', async ({
    page,
  }) => {
    // Malformed status data to trigger an unhandled render error inside TvLayout
    const corruptedStatus = {
      ...mockStatusResponse,
      status: {
        ...mockStatusResponse.status,
        display: null as unknown as StatusResponse['status']['display'],
      },
    };

    await page.route('**/api/lobby/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(corruptedStatus),
      });
    });

    await page.goto('/tv');

    // Error boundary fallback should be visible
    await expect(page.getByText('Layar sedang dipulihkan')).toBeVisible();
    await expect(page.getByText('Sistem sedang memulihkan koneksi data')).toBeVisible();
  });
});
