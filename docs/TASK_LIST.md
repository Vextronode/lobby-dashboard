# Task List Implementasi — Lobby Dashboard Desa Cibenda

Dokumen ini merupakan panduan rencana kerja (*actionable task list*) terstruktur untuk menyelesaikan seluruh implementasi sistem **Lobby Dashboard Desa Cibenda** berdasarkan spesifikasi fitur ([F01–F14](specs/README.md)), keputusan arsitektur, dan pedoman kode ([CODE_GUIDELINES.md](CODE_GUIDELINES.md)).

---

## 1. Status Kemajuan Proyek (Progress Overview)

| Tiket | Area Kerja | Deskripsi Inti | Status |
|---|---|---|---|
| **LOBBY-01** | Fondasi Monorepo | Setup monorepo pnpm, skema Zod kontrak, fixture data upstream, mock upstream server. | **SELESAI** |
| **LOBBY-02** | Aggregator & Core | Engine sinkronisasi data 3 upstream, cache in-memory, snapshot disk, API `/api/lobby/*`, status policy & freshness engine, optimizer thumbnail WebP, notifier Telegram. | **SELESAI** |
| **LOBBY-03** | Kiosk TV Display | Antarmuka TV (`/tv`, 1280×720), global beat 15s, Card F01–F09, ticker F03, layar awas F02, error recovery F13. | **SELESAI** |
| **LOBBY-04** | Portal Mobile | Halaman publik HP (`/`), responsif $\ge 320$ px, LCP $< 3$s, carousel CiMart, shortcut 3 aplikasi desa (`/#aplikasi`). | **BELUM** |
| **LOBBY-05** | Kiosk Hardware & Ops | Hardening TV fisik, soak test 72 jam, simulasi mati listrik/jaringan, uji notifikasi Telegram lapangan. | **BELUM** |

---

## 2. Rincian Task List Implementasi

---

### TAHAP 1: Implementasi Antarmuka Kiosk TV (`/tv`) [Tiket: LOBBY-03]
> **Tujuan**: Membangun seluruh tampilan TV lobi kantor desa (1280×720) yang berjalan otomatis, sinkron, dan tahan banting.

#### 1.1 Kerangka & Layout Kiosk TV (1280×720)
- [x] Buat layout grid TV 1280×720 di `apps/web/src/tv/TvLayout.tsx` menggunakan CSS Modules netral (tanpa CSS framework).
- [x] Implementasikan CSS reset kiosk di `apps/web/src/tv/tv.css`: `cursor: none`, `overflow: hidden`, `user-select: none`, tanpa scrollbar.
- [x] Bangun komponen Header TV: Logo/Nama Desa Cibenda, penunjuk waktu nyata berbasis jam server terkoreksi (WIB), dan indikator koneksi netral.
- [x] Bangun Footer TV: Area running text ticker selebar layar dan modul QR Code klien di pojok kanan bawah yang mengarah ke `public_url` (F11).

#### 1.2 Global Beat Engine (Rotasi Serempak 15 Detik — F10)
- [x] Buat fungsi murni `calculateBeat(serverTimeMs: number): number` dan `calculateSlideIndex(beat: number, totalSlides: number): number` di `@lobby/core/src/rotation.ts`.
- [x] Implementasikan logika histeresis perubahan jumlah slide: jika jumlah slide berubah ($n \to n_{baru}$), tahan transisi hingga `beat % n_baru === 0` (F10 R-4).
- [x] Tulis *table-driven unit test* untuk rotasi beat di `@lobby/core/test/rotation.test.ts` (AC-F10-1, AC-F10-2).
- [x] Buat hook React `useGlobalBeat(totalSlides: number)` di `apps/web/src/shared/hooks/useGlobalBeat.ts` yang tersinkronisasi presisi ke detik :00, :15, :30, :45 jam server (AC-F10-3, AC-F10-4).

#### 1.3 Komponen Card Statis (Kolom Kiri & Kanan)
- [x] **Card Status Kesiapsiagaan (F01)** di `apps/web/src/tv/cards/StatusCard.tsx`:
  - Render ikon dan warna sesuai level tampil: GREEN (Aman), YELLOW (Waspada), ORANGE (Siaga), UNKNOWN (Data tidak terkini, abu-abu netral).
  - Tampilkan label tahan: *"Terakhir diperbarui HH.MM, data mungkin tidak terkini"* jika kondisi stale-hold aktif (F01 R-5).
  - Pastikan kata "Aman" tidak pernah muncul pada state fallback atau error (AC-F01-1, AC-F01-6).
- [x] **Card Gempa Pangandaran (F05)** di `apps/web/src/tv/cards/QuakePangandaranCard.tsx`:
  - Tampilkan magnitudo, lokasi, kedalaman, jarak ke Cibenda (`distanceToVillage`), dan waktu kejadian WIB.
  - Terapkan gaya redup (*muted contrast*) jika waktu kejadian $>24$ jam lalu (F05 R-5, AC-F05-1).
  - Tangani `data: null` dengan pesan ramah *"Tidak ada gempa terkini yang berdampak ke Pangandaran"* (AC-F05-2).
- [x] **Card Penduduk (F07)** di `apps/web/src/tv/cards/PopulationCard.tsx`:
  - Tampilkan total jiwa (L + P konsisten), jumlah KK aktif, rasio gender, dan label *"Data per <tanggal WIB>"*.
  - Tangani kondisi `published: false` dengan menampilkan *"Data kependudukan sedang dimutakhirkan"* (AC-F07-7).

#### 1.4 Komponen Card Berotasi (Sinkron Beat 15 Detik)
- [x] **Card Prakiraan Cuaca 3 Hari (F04)** di `apps/web/src/tv/cards/WeatherCard.tsx`:
  - Rotasikan 3 slide: Hari Ini, Besok, Lusa dengan suhu maks dan peluang hujan.
  - Terapkan aturan khusus kesegaran: jika state `stale` atau `unavailable`, tampilkan 1 slide *"Belum ada informasi terbaru"* tanpa menampilkan ramalan lama (AC-F04-4).
- [x] **Card Gempa Jabar & Indonesia (F06)** di `apps/web/src/tv/cards/QuakeListCard.tsx`:
  - Tampilkan 3 baris kejadian per slide/halaman.
  - Rotasikan $\lceil \text{item} / 3 \rceil$ halaman pada setiap ketukan 15s (AC-F06-3).
  - Tampilkan tag asal kejadian ("Jabar" atau "Indonesia") dengan deduplikasi yang benar.
- [x] **Card Profil Warga (F07)** di `apps/web/src/tv/cards/CitizenProfileCard.tsx`:
  - Slide 1: Piramida penduduk kelompok umur 10 tahunan $\times$ gender (nilai $<10$ tampil sebagai `"<10"`).
  - Slide 2: Top 5 mata pencaharian warga + baris ringkasan non-kerja/belum bekerja (AC-F07-4).
  - Slide 3: Sebaran jumlah warga per dusun aktif.
  - Jika `published: false`, tampilkan placeholder dan hentikan rotasi slide (1 slide tetap).
- [x] **Card Layanan Surat (F08)** di `apps/web/src/tv/cards/LetterServicesCard.tsx`:
  - Slide 1: KPI bulan berjalan (Diajukan, Selesai diproses, Sedang diproses) + diagram batang tren 12 minggu.
  - Slide 2: Jenis surat terpopuler dari allowlist desa (volume $\ge 10$). Jika allowlist kosong, batasi card hanya menjadi 1 slide (AC-F08-5, AC-F08-6).
- [x] **Card Etalase CiMart (F09)** di `apps/web/src/tv/cards/CiMartCard.tsx`:
  - Fase 0 (produk $<3$): Rotasikan 3 slide edukasi & ajakan pendaftaran pedagang via SKU kantor desa.
  - Fase 1 (produk $\ge 3$): Rotasikan 1 produk per slide (maks 8 produk dengan thumbnail WebP) + 1 slide ajakan per siklus (AC-F09-5).
  - Tangani `unavailable`: tampilkan *"Belanja produk warga Cibenda di CiMart"* tanpa kata *"Segera hadir"* (AC-F09-6).

#### 1.5 Komponen Running Text Ticker (F03)
- [x] Bangun logika perakitan teks `buildTicker` di `@lobby/core/src/ticker.ts` dengan 3 mode: `normal`, `priority`, dan `override` (F03 R-1 s.d. R-4).
- [x] Pastikan notice pencabutan Awas (F02 R-4) selalu menjadi item pertama selama 10 menit aktif.
- [x] Integrasikan pengumuman SID (maks 5 warta, $\le 30$ hari) dan tips kesiapsiagaan (min 3 tips).
- [x] Bangun komponen `apps/web/src/tv/ticker/TickerBar.tsx` menggunakan CSS `transform` kontinu tanpa jeda patah (AC-F03-1 s.d. AC-F03-5).

#### 1.6 Layar Darurat Awas (F02 Fullscreen Takeover)
- [x] Bangun komponen `apps/web/src/tv/screen/AwasScreen.tsx` untuk pengambilalihan layar penuh saat level tampil RED.
- [x] Tampilkan informasi keselamatan: alasan darurat, daftar titik kumpul (maks 3), kontak darurat instansi (maks 4), dan jam pembaruan.
- [x] Hentikan seluruh rotasi card saat Awas aktif (F02 R-1).
- [x] Verifikasi histeresis pencabutan: hanya keluar setelah 2x sinkronisasi berturut-turut berstatus segar $< \text{RED}$ (AC-F02-1, AC-F02-5).

#### 1.7 Recovery Kiosk & Ketahanan TV (F13)
- [x] Implementasikan Error Boundary React di `apps/web/src/tv/recovery/TvErrorBoundary.tsx`: tampilkan layar netral *"Layar sedang dipulihkan"* dan picu reload otomatis setelah 10 detik (AC-F13-2).
- [x] Batasi pemulihan: maksimal 3 reload otomatis dalam 1 jam untuk mencegah crash-loop tak berujung.
- [x] Pasang penjadwal reload rutin harian setiap pukul 03.00 WIB (F13 R-4).
- [x] Tambahkan pendeteksi perubahan hash `build` dari server: reload mulus pada ketukan berikutnya (F13 R-5, AC-F13-3).
- [x] Simpan snapshot data terakhir di cache lokal peramban (IndexedDB/localStorage) agar layar tetap menampilkan data bertanda basi saat jaringan padam (AC-F13-1).

#### 1.8 Pengujian & Verifikasi LOBBY-03
- [x] Jalankan unit test komponen dan hooks (`pnpm test`).
- [x] Jalankan Playwright E2E TV untuk menguji skenario skenario mock (`pnpm e2e`):
  - Skenario normal, `red` (layar awas), `red-then-orange` (pencabutan histeresis), `sid-down`, `sigap-fallback`.
- [x] Validasi linting dan formatting (`pnpm check`).

---

### TAHAP 2: Implementasi Portal Mobile Warga (`/`) [Tiket: LOBBY-04]
> **Tujuan**: Membangun portal web mobile yang dibuka warga saat memindai QR code TV, menyajikan informasi cepat, hemat kuota, dan gerbang ke 3 aplikasi desa.

#### 2.1 Kerangka & Tata Letak Mobile Responsif (F11)
- [x] Bangun layout vertikal di `apps/web/src/mobile/MobileLayout.tsx` dengan CSS Modules adaptif (min 320 px tanpa overflow horizontal).
- [x] Pastikan seluruh elemen tombol dan tautan memiliki ukuran target sentuh (*tap target*) minimal **48 × 48 px**.
- [x] Tambahkan tombol manual "Perbarui" di bagian header untuk penyegaran data secara eksplisit.
- [x] Pasang `IntersectionObserver` / *Page Visibility API* untuk menghentikan polling data saat tab diminimalkan atau di latar belakang (AC-F11-4).

#### 2.2 Komponen Banner Awas & Status (F01, F02)
- [x] Render Banner Merah Darurat di posisi paling atas jika level RED: judul AWAS, alasan, titik kumpul, dan tombol kontak darurat bertautan langsung `tel:<nomor>` (AC-F02-6).
- [x] Render Card Status Kesiapsiagaan ringkas (tanpa banner jika level bukan RED).

#### 2.3 Komponen Cuaca & Gempa Terkini (F04, F05)
- [x] Render Prakiraan Cuaca 3 Hari secara berdampingan (Hari ini, Besok, Lusa) dalam 1 baris/kartu terpadu (F04 R-5).
- [x] Tampilkan informasi Gempa Pangandaran terakhir tepat di bawah prakiraan cuaca.

#### 2.4 Komponen Pengumuman Desa (F03, F11)
- [x] Tampilkan tepat **1 pengumuman resmi desa teratas** (judul dan tanggal WIB).
- [x] Sembunyikan bagian ini secara bersih jika tidak ada pengumuman terbit aktif (F11 R-4).

#### 2.5 Carousel Produk CiMart (F09)
- [x] Bangun carousel sentuh (*touch swipe*) horizontal untuk menampilkan produk UMKM terverifikasi warga.
- [x] Setiap ubin produk menautkan langsung ke halaman detail produk di aplikasi CiMart.
- [x] Jika Fase 0 atau unavailable, tampilkan 1 kartu edukasi pendaftaran UMKM melalui SKU.
- [x] Pastikan total ukuran aset gambar tidak melebihi **400 KB** per kunjungan (F09 NFR-1).

#### 2.6 Portal Akses 3 Aplikasi Desa (F11)
- [x] Bangun 3 kartu peluncur aplikasi dari konfigurasi desa (`/#aplikasi`):
  1. **Buka SIGAP**: Sistem Mitigasi & Peringatan Dini Bencana.
  2. **Ajukan Surat (SID)**: Layanan Administrasi & Persuratan Mandiri Warga.
  3. **Belanja di CiMart**: Pasar Online UMKM Warga Desa Cibenda.
- [x] Pastikan anchor ID `/#aplikasi` dapat diakses langsung dari URL QR eksternal (AC-F11-2).
- [x] Pastikan data Penduduk (F07) dan Layanan Surat (F08) **sama sekali tidak dirender** di halaman mobile (AC-F11-5).

#### 2.7 Pengujian & Verifikasi LOBBY-04
- [x] Uji kompatibilitas layar sempit (viewport 320 px) bebas scroll horizontal (AC-F11-3).
- [x] Uji audit aksesibilitas menggunakan `axe-core` (lulus kontras warna dan atribut semantik).
- [x] Uji simulasi jaringan lambat (*Slow 4G*) untuk memverifikasi LCP $< 3$ detik.

---

### TAHAP 3: Deployment, Kiosk Hardware & Pengujian Lapangan [Tiket: LOBBY-05]
> **Tujuan**: Konfigurasi perangkat fisik TV lobi di kantor desa dan pengujian ketahanan operasional jangka panjang.

#### 3.1 Konfigurasi Perangkat TV Fisik
- [ ] Atur browser Android TV / mini PC kiosk untuk membuka otomatis URL `http://<host>/tv?device=lobby-tv-1` saat perangkat menyala (*auto-start on boot*).
- [ ] Daftarkan identifier `lobby-tv-1` pada konfigurasi aggregator `devices.monitored`.
- [ ] Verifikasi ketiadaan dialog modal peramban, update popup OS, dan mode sleep layar.

#### 3.2 Uji Ketahanan & Stabilitas (Soak Test 72 Jam)
- [ ] Jalankan skrip soak test `apps/aggregator/scripts/soak.ts` dan pemantauan peramban TV selama 72 jam nonstop.
- [ ] Verifikasi stabilitas memori peramban dan proses Node.js tanpa indikasi kebocoran memori (*memory leak*).

#### 3.3 Uji Pemulihan Fisik di Lokasi (Failover Simulation)
- [ ] **Simulasi Mati Listrik**: Matikan daya TV mendadak, hidupkan kembali $\to$ verifikasi halaman TV muncul otomatis $\le 2$ menit (F13 NFR-2).
- [ ] **Simulasi Jaringan Terputus**: Putuskan koneksi WiFi selama 10 menit $\to$ verifikasi TV tetap menyala menyajikan data terakhir bertanda basi, tanpa layar putih error browser (AC-F13-1).
- [ ] **Simulasi Restart Server**: Restart container aggregator $\to$ verifikasi TV melanjutkan rotasi dengan data snapshot disk instan.

#### 3.4 Uji Notifikasi Operasional Telegram (F14)
- [ ] Uji coba pengiriman pesan bot dengan perintah `pnpm notify:test` ke grup Tim Teknis dan grup Admin Desa.
- [ ] Simulasikan TV mati $>5$ menit di jam kerja (Senin–Jumat 07.00–16.00 WIB) $\to$ verifikasi pesan admin desa terkirim dalam bahasa awas/praktis (AC-F14-2).
- [ ] Simulasikan TV mati di luar jam kerja $\to$ verifikasi bot tidak mengirim pesan gangguan ke admin desa.
- [ ] Simulasikan modul upstream gagal 5 kali berturut-turut $\to$ verifikasi 1 pesan siaga ke tim teknis dan 1 pesan pulih saat normal (AC-F14-1).

---

## 3. Matriks Acceptance Criteria per Spesifikasi Fitur

| Kode AC | Kebutuhan Utama | Tiket Penguji | Status |
|---|---|---|---|
| **AC-F01-1** | `baseline-safe` tidak pernah tampil "Aman", melainkan "Data tidak terkini" | LOBBY-02, LOBBY-03 | LOBBY-02 Selesai, LOBBY-03 Menunggu UI |
| **AC-F01-2** | ORANGE lalu SIGAP padam 10 menit $\to$ status tetap Siaga (stale-hold) | LOBBY-02 | **LULUS** |
| **AC-F01-5** | TV tidak dapat menghubungi aggregator $>90$s $\to$ evaluasi lokal mandiri | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F02-1** | Keluar dari mode Awas butuh 2x sinkronisasi berturut-turut $< \text{RED}$ | LOBBY-02, LOBBY-03 | LOBBY-02 Selesai, LOBBY-03 Menunggu UI |
| **AC-F02-6** | Skenario RED di mobile menampilkan banner merah dengan tautan `tel:` | LOBBY-04 | Menunggu LOBBY-04 |
| **AC-F03-1** | Table test `buildTicker` untuk semua mode & notice | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F04-4** | Cuaca saat stale menampilkan "Belum ada informasi terbaru" | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F05-1** | Gempa Pangandaran $>24$ jam tampil dengan kontras diredam | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F06-3** | 7 data gempa $\to$ 3 halaman berganti per ketukan 15s | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F07-7** | SID unpublished $\to$ placeholder tampil & profil warga tidak berotasi | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F08-6** | Allowlist surat kosong $\to$ card layanan surat menjadi 1 slide | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F09-5** | CiMart Fase 1 dengan 8 produk $\to$ 9 slide rotasi | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F10-3** | Dua tab browser menampilkan slide yang sama pada ketukan waktu yang sama | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F11-3** | Tampilan mobile bebas scroll horizontal pada lebar layar 320 px | LOBBY-04 | Menunggu LOBBY-04 |
| **AC-F11-5** | Data penduduk dan layanan surat tidak muncul di mobile | LOBBY-04 | Menunggu LOBBY-04 |
| **AC-F12-4** | Semua modul unavailable $\to$ placeholder netral tanpa kode error teknis | LOBBY-03, LOBBY-04 | Menunggu LOBBY-03 & 04 |
| **AC-F13-2** | Error crash $\to$ layar netral pemulihan $\to$ auto-reload (maks 3x/jam) | LOBBY-03 | Menunggu LOBBY-03 |
| **AC-F14-2** | TV offline di jam kerja kirim pesan ke admin desa; di luar jam kerja diam | LOBBY-02, LOBBY-05 | LOBBY-02 Selesai, LOBBY-05 Menunggu Uji |
