import type { ContentResponse, StatusResponse } from '@lobby/contract';
import { expect, test } from '@playwright/test';

const mockStatusGreen: StatusResponse = {
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

const mockStatusRed: StatusResponse = {
  server_time: '2026-11-24T08:00:00.000Z',
  build: 'test-build-1',
  status: {
    state: 'ok',
    fetched_at: '2026-11-24T08:00:00.000Z',
    age_s: 0,
    data: null,
    display: {
      level: 'RED',
      source_level: 'RED',
      reason: 'Peringatan Dini Tsunami: Gelombang terdeteksi di Pantai Barat Pangandaran.',
      alert_created_at: '2026-11-24T08:00:00.000Z',
      stale_hold: false,
      awas: true,
      ticker_mode: 'override',
      notice: null,
      last_updated_at: '2026-11-24T08:00:00.000Z',
    },
  },
};

const mockContent: ContentResponse = {
  server_time: '2026-11-24T08:00:00.000Z',
  build: 'test-build-1',
  static: {
    public_url: 'http://localhost:5173/',
    tips: [
      'Siapkan tas siaga berisi dokumen penting, obat-obatan, senter, dan air minum.',
      'Kenali jalur evakuasi dan titik kumpul terdekat dari rumah Anda.',
    ],
    app_links: [
      { id: 'sigap', label: 'Buka SIGAP', url: 'https://sigap.example.id/' },
      { id: 'sid', label: 'Ajukan Surat (SID)', url: 'https://sid.example.id/' },
      { id: 'cimart', label: 'Belanja di CiMart', url: 'https://cimart.example.id/' },
    ],
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
          rain_probability_pct: 35,
        },
      ],
    },
    quake_pangandaran: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        magnitude: 4.6,
        depth: '18 km',
        location: '62 km BaratDaya PANGANDARAN-JABAR',
        distance_to_village_km: 62,
        potential: 'Tidak berpotensi tsunami',
        updated_at: '2026-11-24T07:30:00.000Z',
      },
    },
    quake_list: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: { mode: 'recent', items: [] },
    },
    preparedness: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        evacuation_points: [
          { id: 'evac-01', name: 'Lapangan Karanganyar', address: 'Dusun Karanganyar' },
          { id: 'evac-02', name: 'Balai Desa Cibenda', address: 'Jl. Raya Cibenda' },
        ],
        contacts: [
          { id: 'contact-01', institution: 'Posko Siaga Desa', phone_number: '081234567890' },
          { id: 'contact-02', institution: 'BPBD Pangandaran', phone_number: '112' },
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
          buckets: [],
        },
        occupations: {
          top: [],
          others_count: 0,
          non_working_count: 0,
          unfilled_count: 0,
        },
        hamlets: {
          items: [],
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
            submitted: 10,
            completed: 9,
          })),
          top_types: [],
        },
        announcements: [
          {
            id: 'ann-1',
            title: 'Jadwal Kerja Bakti Kebersihan Saluran Air Desa',
            published_at: '2026-11-24T06:00:00.000Z',
          },
        ],
      },
    },
    cimart: {
      state: 'ok',
      fetched_at: '2026-11-24T08:00:00.000Z',
      age_s: 0,
      data: {
        phase: 1,
        generated_at: '2026-11-24T08:00:00.000Z',
        stats: { active_stores: 12, available_products: 48 },
        featured_products: [
          {
            id: 101,
            name: 'Gula Kelapa Asli Pangandaran',
            slug: 'gula-kelapa-asli',
            price: 25000,
            unit: 'kg',
            image_url: null,
            category: { name: 'Hasil Bumi', slug: 'hasil-bumi' },
            store: { name: 'KWT Melati Cibenda', slug: 'kwt-melati' },
            url: 'https://cimart.example.id/products/gula-kelapa-asli',
          },
        ],
      },
    },
  },
};

test.describe('Mobile Portal Warga LOBBY-04 (Route /)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/lobby/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatusGreen),
      });
    });

    await page.route('/api/lobby/content', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContent),
      });
    });
  });

  test('AC-F11-3: narrow viewport 320px has zero horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Desa Cibenda/i })).toBeVisible();

    // Verify document does not have horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    const outDir = process.env.SCREENSHOT_OUT_DIR;
    if (outDir) {
      await page.screenshot({ path: `${outDir}/mobile-320px.png`, fullPage: true });
    }

    // Verify all interactive buttons and links meet min 48x48px tap target
    const tapTargets = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      return elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          text: el.textContent.trim().slice(0, 30),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          valid: rect.width >= 47.5 && rect.height >= 47.5, // 0.5px float tolerance
        };
      });
    });

    for (const target of tapTargets) {
      expect(
        target.valid,
        `Tap target too small for ${target.tag} "${target.text}": ${target.width.toString()}x${target.height.toString()}`,
      ).toBe(true);
    }
  });

  test('AC-F11-2: /#aplikasi directs to Aplikasi Desa with 3 configured links', async ({
    page,
  }) => {
    await page.goto('/#aplikasi');

    const appSection = page.locator('#aplikasi');
    await expect(appSection).toBeVisible();

    // Verify the 3 configured launch cards
    const sigapLink = page.getByRole('link', { name: /Buka SIGAP/i });
    const sidLink = page.getByRole('link', { name: /Ajukan Surat \(SID\)/i });
    const cimartLink = page.getByRole('link', { name: /Belanja di CiMart/i });

    await expect(sigapLink).toBeVisible();
    await expect(sidLink).toBeVisible();
    await expect(cimartLink).toBeVisible();

    await expect(sigapLink).toHaveAttribute('href', 'https://sigap.example.id/');
    await expect(sidLink).toHaveAttribute('href', 'https://sid.example.id/');
    await expect(cimartLink).toHaveAttribute('href', 'https://cimart.example.id/');

    // F11 R-9: links open in same tab
    await expect(sigapLink).toHaveAttribute('target', '_self');

    const outDir = process.env.SCREENSHOT_OUT_DIR;
    if (outDir) {
      await page.screenshot({ path: `${outDir}/mobile-aplikasi.png` });
    }
  });

  test('AC-F11-5: strict data exclusion (no population or letter services data)', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Desa Cibenda/i })).toBeVisible();

    // Verify no population elements
    await expect(page.getByText(/Total Jiwa/i)).not.toBeVisible();
    await expect(page.getByText(/Kepala Keluarga/i)).not.toBeVisible();
    await expect(page.getByText(/Piramida Penduduk/i)).not.toBeVisible();
    await expect(page.getByText(/Mata Pencaharian Utama/i)).not.toBeVisible();

    // Verify no letter services elements
    await expect(page.getByText(/Layanan Surat Desa/i)).not.toBeVisible();
    await expect(page.getByText(/Kinerja permohonan surat/i)).not.toBeVisible();
    await expect(page.getByText(/Tren 12 Minggu Terakhir/i)).not.toBeVisible();
  });

  test('AC-F02-6: red mode displays emergency banner on top with tel: links', async ({ page }) => {
    // Override status to RED
    await page.route('/api/lobby/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatusRed),
      });
    });

    await page.goto('/');

    const emergencyBanner = page.locator('section[role="alert"]');
    await expect(emergencyBanner).toBeVisible();
    await expect(emergencyBanner).toContainText('STATUS AWAS');
    await expect(emergencyBanner).toContainText('Peringatan Dini Tsunami');

    // Verify evacuation points
    await expect(emergencyBanner).toContainText('Lapangan Karanganyar');
    await expect(emergencyBanner).toContainText('Balai Desa Cibenda');

    // Verify emergency call links with tel: scheme
    const phoneLinks = emergencyBanner.locator('a[href^="tel:"]');
    await expect(phoneLinks).toHaveCount(2);
    await expect(phoneLinks.first()).toHaveAttribute('href', 'tel:081234567890');
    await expect(phoneLinks.nth(1)).toHaveAttribute('href', 'tel:112');

    const outDir = process.env.SCREENSHOT_OUT_DIR;
    if (outDir) {
      await page.screenshot({ path: `${outDir}/mobile-red.png`, fullPage: true });
    }
  });

  test('manual refresh button triggers data reload', async ({ page }) => {
    let statusFetchCount = 0;
    await page.route('/api/lobby/status*', async (route) => {
      statusFetchCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatusGreen),
      });
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Desa Cibenda/i })).toBeVisible();

    const initialCount = statusFetchCount;
    const refreshBtn = page.getByRole('button', { name: /Perbarui/i });
    await refreshBtn.click();

    await expect.poll(() => statusFetchCount).toBeGreaterThan(initialCount);
  });
});
