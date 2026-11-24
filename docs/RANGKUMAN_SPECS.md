# Rangkuman Komprehensif Spesifikasi Fitur (F01–F14)
## Lobby Dashboard & Public Summary Module — Desa Cibenda

Dokumen ini merupakan rangkuman terpadu dan sumber referensi cepat dari seluruh spesifikasi fitur (**F01 sampai F14**) yang diterapkan pada sistem **Lobby Dashboard Desa Cibenda**. Dokumen ini merangkum tujuan bisnis, arsitektur data, aturan perilaku (*business logic*), mekanisme penanganan kegagalan, hingga kebijakan privasi dan keandalan sistem.

---

## 1. Ikhtisar Sistem & Visi Produk

Lobby Dashboard Desa Cibenda adalah platform informasi publik multi-saluran yang dirancang untuk:
1. **Layar TV Kiosk Lobby Kantor Desa (`/tv`)**: Berjalan 24/7 pada resolusi tetap 1280×720 dalam mode *read-only* tanpa intervensi operator manusia.
2. **Halaman Publik Mobile (`/`)**: Dibuka warga dengan memindai kode QR di layar TV, menyajikan informasi esensial dan pintu gerbang menuju 3 aplikasi digital desa.

### Tiga Pilar Sumber Data Upstream
Sistem menghubungkan tiga platform independen milik ekosistem digital Desa Cibenda:
- **SIGAP**: Sistem Informasi Siaga Bencana (status kesiapsiagaan, gempa bumi BMKG, prakiraan cuaca, titik kumpul evakuasi, kontak darurat).
- **SID (Sistem Informasi Desa)**: Data kependudukan agregat, performa layanan surat warga, dan pengumuman resmi desa.
- **CiMart (Cibenda Market)**: Marketplace produk UMKM warga desa.

### Prinsip Utama (Non-Negotiable Principles)
- **Anti-False-Safe**: Layar **tidak pernah menampilkan status "Aman" jika data sebenarnya tidak diketahui atau terputus**.
- **Perlindungan Bahaya Persisten (Stale-Hold)**: Peringatan bahaya (Siaga/Awas) tidak boleh hilang dari layar hanya karena koneksi internet terputus.
- **Privasi Mutlak**: Tidak ada data pribadi (PII) seperti NIK, nama, alamat, nomor HP warga/penjual, atau data ekonomi keluarga (`family_socioeconomics`). Seluruh sel data kelompok kecil (< 10 orang) disamarkan di sumber (SID).
- **Arsitektur Read-Only & Graceful Degradation**: Tidak ada mutasi data (tanpa POST/PUT/DELETE publik). Kegagalan satu sistem upstream tidak boleh merusak modul lainnya.

---

## 2. Peta Arsitektur & Pembagian Tanggung Jawab

```
+---------------------------------------------------------------------------------+
|                                 SUMBER UPSTREAM                                 |
|      [ SIGAP ]                    [ SID ]                      [ CiMart ]       |
| (Alert, Gempa, Cuaca)     (Penduduk, Surat, Warta)        (Produk UMKM Aktif)   |
+---------------------------------------------------------------------------------+
                                         |
                                         v HTTP Polling berkala (Timeout & Whitelist)
+---------------------------------------------------------------------------------+
|                       APPS/AGGREGATOR (Node.js + Hono)                          |
| - Penjadwal Sinkronisasi Mandiri per Modul (Scheduler & Circuit Breaker)         |
| - Evaluasi Kesegaran Data (Freshness Engine: OK / Stale / Unavailable)          |
| - Snapshot Disk Cache (Tahan Restart) & Optimizer Gambar (Thumbnail 480px WebP) |
| - Notifikasi Telegram (Tim Teknis & Admin Desa)                                 |
+---------------------------------------------------------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
+------------------------------------+   +------------------------------------+
|       TV KIOSK (`/tv`, 1280x720)   |   |        PORTAL MOBILE (`/`)         |
| - Jam Sinkron Server (Rotasi Beat) |   | - Akses via Scan QR di TV          |
| - Card Statis & Card Berotasi 15s  |   | - Responsif (min. 320px, LCP < 3s) |
| - Fullscreen Layar Awas (Override) |   | - Tombol Refresh Manual            |
| - Ticker Berjalan Berkelanjutan    |   | - Link 3 Aplikasi Desa             |
| - Auto-Recovery & Jam Kerja Kiosk  |   | - Pause saat Background Tab        |
+------------------------------------+   +------------------------------------+
```

### Pemisahan Logic dan I/O
- Seluruh aturan perhitungan bisnis, evaluasi status, filter data, dan susunan rotasi berada di paket `@lobby/core` sebagai **fungsi murni** (tanpa dependensi I/O, `now: Date` selalu disuntikkan sebagai parameter).
- Lapisan antarmuka (`apps/web`) hanya menerima data matang yang siap dirender.

---

## 3. Rangkuman Spesifikasi Fitur (F01 s.d. F14)

### Kluster I: Keselamatan & Kebencanaan

#### [F01 — Status Kesiapsiagaan](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F01-status-kesiapsiagaan.md)
* **Tujuan**: Menampilkan tingkat siaga bencana resmi platform SIGAP untuk Desa Cibenda secara permanen di card status utama (tidak ikut rotasi).
* **Aturan Utama**:
  - Level mentah: `GREEN` (Aman), `YELLOW` (Waspada), `ORANGE` (Siaga), `RED` (Awas).
  - Jika respons SIGAP bernilai `fallback`, ber-ID `baseline-safe`, atau di luar 4 level baku, level dianggap `UNKNOWN`.
  - **Kebijakan Tahan (Stale Hold)**: Bila koneksi terputus atau data basi (> 180 dtk), namun level terakhir yang diketahui adalah `ORANGE` atau `RED` (umur $\le$ 24 jam), sistem **wajib mempertahankan level bahaya tersebut** dengan status "ditahan" dan keterangan waktu pembaruan terakhir.
  - Untuk kondisi basi selain bahaya tinggi, status berubah menjadi `UNKNOWN` ("Data tidak terkini" dengan warna abu-abu netral). Kata "Aman" **dilarang keras** muncul saat data tidak pasti.
  - Klien TV melakukan evaluasi mandiri jika tidak berhasil menghubungi aggregator > 90 dtk.

#### [F02 — Layar Awas & Pencabutan](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F02-layar-awas.md)
* **Tujuan**: Mengambil alih seluruh layar TV menjadi tampilan darurat keselamatan saat status mencapai level tertinggi (RED/Awas).
* **Aturan Utama**:
  - **Aktivasi Cepat**: Begitu status RED, TV menghentikan seluruh rotasi card dan menampilkan layar merah penuh: alasan peringatan, daftar titik kumpul evakuasi (maks 3), kontak darurat instansi terkait (maks 4), serta waktu pembaruan.
  - **Pencabutan Histeresis (Keluar Hati-hati)**: Status Awas hanya boleh dicabut jika telah terjadi **2 kali sinkronisasi berturut-turut yang sukses, segar, dan berlevel < RED**. Hal ini mencegah layar berkedip/keluar-masuk mode darurat akibat fluktuasi sementara.
  - **Notice Pasca-Awas**: Saat status Awas dicabut, banner pengumuman *"Status Awas telah dicabut, kini: <Level>"* wajib tayang di baris terdepan running text selama 10 menit.
  - Di mobile, mode Awas tampil sebagai banner merah mencolok di posisi paling atas lengkap dengan tombol panggilan langsung (`tel:`).

#### [F03 — Running Text (Ticker)](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F03-running-text.md)
* **Tujuan**: Menyajikan teks berjalan di bagian bawah layar TV secara mulus (CSS transform), bertindak sebagai kanal informasi dinamis.
* **Tiga Mode Hirarki**:
  1. `override` (Level ORANGE atau RED): Hanya menampilkan pesan darurat dan lokasi titik kumpul evakuasi.
  2. `priority` (Level YELLOW): Peringatan dini di urutan pertama, disusul pengumuman desa, lalu tips kesiapsiagaan.
  3. `normal` (Level GREEN atau UNKNOWN): Pengumuman resmi desa disusul tips kesiapsiagaan.
* **Konten & Batasan**:
  - Pengumuman bersumber dari SID (maksimal 5 pengumuman terbit berumur $\le$ 30 hari). Hanya judul dan tanggal, tanpa isi berita.
  - Tips kesiapsiagaan minimal 3 item dari konfigurasi aggregator (tidak boleh memuat kata yang meninabobokan situasi).
  - Ticker tidak pernah boleh kosong dan tetap berjalan saat layar Awas aktif.

#### [F04 — Prakiraan Cuaca](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F04-prakiraan-cuaca.md)
* **Tujuan**: Menampilkan prakiraan cuaca harian dari SIGAP (sumber data: Open-Meteo) untuk 3 hari: Hari ini, Besok, dan Lusa.
* **Aturan Utama**:
  - Perhitungan hari dihitung ulang secara lokal berdasarkan zona waktu WIB (`Asia/Jakarta`), bukan waktu UTC.
  - Menampilkan ikon cuaca terstandarisasi, suhu maksimum, dan peluang terjadinya hujan.
  - Pola Tampilan: Di TV berotasi 1 hari per slide setiap 15 detik; di mobile ketiga hari ditampilkan berdampingan sekaligus.
  - **Pengecualian Khusus Kesegaran**: Jika data cuaca berstatus basi (*stale*) atau *unavailable*, card cuaca **tidak boleh menampilkan ramalan lama** (karena cuaca kemarin tidak relevan), melainkan menampilkan teks *"Belum ada informasi terbaru"*.

#### [F05 — Gempa Pangandaran](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F05-gempa-pangandaran.md)
* **Tujuan**: Card informasi gempa statis di TV yang khusus memantau gempa bumi terkini yang berdampak langsung terhadap wilayah Pangandaran/Cibenda.
* **Aturan Utama**:
  - Mengambil data dari endpoint khusus SIGAP; jarak ke desa (`distanceToVillage`) menggunakan kalkulasi SIGAP (aggregator tidak menghitung ulang).
  - Format waktu ditampilkan dalam WIB. Jika kejadian gempa telah lewat > 24 jam, tampilan dibuat diredam (*muted contrast*) dengan keterangan *"Lebih dari 24 jam lalu"*.
  - Jika SIGAP mengembalikan data kosong (`null`), sistem menampilkannya sebagai kondisi normal: *"Tidak ada gempa terkini yang berdampak ke Pangandaran"*, bukan sebagai pesan error.

#### [F06 — Gempa Jawa Barat & Indonesia](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F06-gempa-jabar-indonesia.md)
* **Tujuan**: Card berotasi yang menampilkan daftar gabungan gempa bumi di wilayah Jawa Barat dan nasional.
* **Aturan Utama**:
  - Menggabungkan data dari scope Jawa Barat dan Indonesia (maksimum total 9 kejadian terbaru).
  - **Deduplikasi Cerdas**: Gempa yang sama yang tercatat di kedua scope (pencocokan waktu, magnitudo, dan pembulatan koordinat) hanya ditampilkan satu kali dengan label prioritas **"Jabar"**.
  - **Paginasi Per Ketukan**: Menampilkan 3 baris per slide/halaman, berpindah halaman setiap ketukan 15 detik. Bukan scroll kontinu.
  - Fallback mode (`latest-pair`): Jika endpoint riwayat belum tersedia, sistem menampilkan 2 baris (1 Jabar + 1 Indonesia).

---

### Kluster II: Pemerintahan & Ekonomi Warga

#### [F07 — Penduduk & Profil Warga](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F07-penduduk-dan-profil-warga.md)
* **Tujuan**: Menyajikan transparansi demografi desa melalui 2 card di TV: Card **Penduduk** (statis) dan Card **Profil Warga** (berotasi 3 slide).
* **Aturan Privasi & Tata Kelola Data**:
  - **Gating Publikasi**: Terkunci di level SID via flag `LOBBY_POPULATION_PUBLISHED`. Jika bernilai `false`, SID tidak memproses query kependudukan dan dashboard menampilkan *"Data kependudukan sedang dimutakhirkan"*.
  - **Ambang Penyamaran (Cell Suppression)**: Setiap agregasi sel dengan jumlah **< 10 orang** dikirim sebagai `null` dari SID dan dirender sebagai **"<10"** di dashboard untuk mencegah de-anonimisasi warga.
  - Larangan Keras: Dilarang menyentuh tabel ekonomi keluarga (`family_socioeconomics`) dan data individu warga. Data penduduk tidak ditampilkan di versi mobile.
* **Struktur Tampilan**:
  - *Card Penduduk*: Total jiwa (Laki-laki + Perempuan = Total konsisten), jumlah KK aktif, rasio gender, dan tanggal mutasi data terakhir (`as_of`).
  - *Card Profil Warga*: Slide 1 Piramida usia 10 tahunan; Slide 2 Top 5 mata pencaharian (kategori non-kerja seperti pelajar, IRT, dan belum bekerja dipisahkan ke ringkasan bawah); Slide 3 Sebaran per dusun aktif.

#### [F08 — Layanan Surat](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F08-layanan-surat.md)
* **Tujuan**: Menampilkan akuntabilitas dan efisiensi pelayanan administrasi persuratan Kantor Desa Cibenda.
* **Aturan Utama**:
  - Menampilkan KPI bulan berjalan dalam WIB: Surat Diajukan, Selesai Diproses (disetujui maupun ditolak), dan Sedang Diproses.
  - **Logika Status Terminal**: Surat dihitung selesai tepat saat transisi status terminal pertamanya terjadi di log, menghindari penghitungan ganda.
  - Grafik tren agregat 12 minggu ke belakang (Senin–Minggu WIB).
  - Slide jenis surat terpopuler hanya menampilkan kode jenis surat yang masuk dalam *allowlist* resmi desa (dengan volume $\ge$ 10 per jenis). Jika allowlist kosong, card hanya menampilkan 1 slide KPI tren.
  - Dilarang menampilkan nama pemohon, isi surat, atau komparasi kinerja antar-petugas desa.

#### [F09 — Etalase CiMart](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F09-etalase-cimart.md)
* **Tujuan**: Mempromosikan produk lokal UMKM desa di card TV dan carousel interaktif di mobile.
* **Mekanisme Dua Fase (Dual-Phase)**:
  - **Fase 0 (Katalog Belum Siap / Produk < 3)**: Menampilkan 3 slide edukasi & ajakan: pengenalan marketplace CiMart, profil aplikasi, dan panduan pendaftaran pedagang melalui Surat Keterangan Usaha (SKU) dari kantor desa.
  - **Fase 1 (Katalog Siap / Produk $\ge$ 3)**: Menampilkan produk terverifikasi (maksimum 8 produk, 1 produk per slide) ditambah 1 slide ajakan mendaftar per siklus.
* **Penanganan Gambar & Keamanan**:
  - Seluruh gambar diproses oleh aggregator menjadi thumbnail WebP 480 px. TV dan perangkat mobile tidak pernah memuat URL mentah dari origin CiMart langsung.
  - Produk tanpa foto atau gagal diunduh akan dialihkan ke ubin kategori grafis (*category tile*).
  - Tidak diperkenankan memakai data produk tiruan (*dummy*) di lingkungan produksi.

---

### Kluster III: Sinkronisasi, Antarmuka & Ekosistem

#### [F10 — Rotasi Serempak 15 Detik (The Global Beat)](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F10-rotasi-serempak.md)
* **Tujuan**: Menyelaraskan seluruh pergantian slide di TV lobi pada satu ketukan (*beat*) waktu global setiap 15 detik.
* **Prinsip Operasional**:
  - Rumus ketukan: $\text{ketukan} = \lfloor \text{jam\_server\_terkoreksi} / 15000 \rfloor$.
  - Nomor slide yang tampil di setiap card: $\text{ketukan} \pmod n$ (di mana $n$ adalah jumlah slide card tersebut).
  - Seluruh unit TV di kantor desa menampilkan slide yang seragam pada detik yang sama (:00, :15, :30, :45).
  - **Transisi $n$ Tanpa Hentakan**: Jika pembaruan data mengubah jumlah slide dari $n_{lama}$ ke $n_{baru}$, perubahan tersebut ditahan hingga ketukan yang memenuhi $\text{ketukan} \pmod{n_{baru}} = 0$.
  - Card yang **TIDAK PERNAH BEROTASI**: Card Status (F01), Card Gempa Pangandaran (F05), dan Card Penduduk (F07). Rotasi berhenti total saat Layar Awas (F02) aktif.

#### [F11 — Halaman Mobile, QR & Akses Aplikasi Desa](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F11-halaman-mobile-dan-qr.md)
* **Tujuan**: Menyediakan portal ringkas yang diakses warga saat memindai QR code di sudut layar TV.
* **Fitur & Arsitektur Mobile**:
  - Kode QR digenerate secara lokal di browser klien (tanpa layanan pihak ketiga) mengarah ke `public_url`.
  - Susunan halaman vertikal: (1) Status kesiapsiagaan, (2) Cuaca 3 hari & gempa Pangandaran, (3) 1 Pengumuman teratas, (4) Carousel produk CiMart, (5) Kartu navigasi 3 Aplikasi Desa.
  - **Akses Langsung Portal**: Tautan `/#aplikasi` langsung mengarahkan warga ke kartu peluncur aplikasi SIGAP, SID (Pelayanan Surat), dan CiMart.
  - Performa & Aksesibilitas: Beban gambar $\le$ 400 KB, LCP < 3 detik di jaringan lambat (Slow 4G), ukuran target sentuh $\ge$ 48 px, adaptif hingga lebar layar terkecil 320 px tanpa *horizontal scrollbar*.
  - Hemat Daya: Polling otomatis dihentikan saat tab diminimalkan atau berada di latar belakang.

---

### Kluster IV: Keandalan, Pemulihan & Operasional

#### [F12 — Kesegaran Data & Siklus Hidup Modul](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F12-kesegaran-data.md)
* **Tujuan**: Menjamin kejujuran informasi di layar melalui pemantauan umur data per modul secara terisolasi.
* **4 State Modul Dinamis**:
  - `loading`: Permintaan awal sedang berjalan, belum ada data.
  - `ok`: Umur data $\le 3 \times \text{interval sinkronisasi}$.
  - `stale`: Umur data $> 3 \times \text{interval sinkronisasi}$ namun belum melewati batas kadaluarsa.
  - `unavailable`: Belum pernah berhasil diperoleh, atau umur data telah melampaui batas umur maksimum.
* **Matriks Parameter Modul**:
  | Modul Data | Interval Sinkron | Masuk Kategori Basi (*Stale*) | Kadaluarsa Maksimum (*Unavailable*) |
  |---|---|---|---|
  | Status Kesiapsiagaan | 60 detik | > 3 menit | 24 jam |
  | Gempa Pangandaran & Regional | 60 detik | > 3 menit | 24 jam |
  | Prakiraan Cuaca | 15 menit | > 45 menit | 24 jam |
  | Titik Kumpul & Kontak Darurat | 60 menit | > 3 jam | 7 hari |
  | Data Penduduk SID | 60 menit | > 3 jam | 7 hari |
  | Layanan Surat & Pengumuman | 15 menit | > 45 menit | 24 jam |
  | Katalog Produk CiMart | 15 menit | > 45 menit | 24 jam |
* **Ketahanan Sistem**: Kegagalan berulang mengaktifkan *exponential backoff* (maksimal 15 menit; untuk status maksimal 2 menit). Kegagalan satu modul tidak pernah menghapus data modul lain atau data lama yang sudah tersimpan di memori/snapshot.

#### [F13 — Pemulihan Mandiri Kiosk (Recovery Kiosk)](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F13-recovery-kiosk.md)
* **Tujuan**: Menjamin TV lobi dapat beroperasi terus-menerus selama berbulan-bulan tanpa membutuhkan tindakan restart manual dari staf desa.
* **Mekanisme Pemulihan**:
  - **Local Offline Shell**: Shell aplikasi dan data terakhir di-cache di perangkat TV. Jika server aggregator padam, layar tetap menyala menyajikan data terakhir bertanda basi (tidak pernah menampilkan layar galat browser *ERR_CONNECTION_REFUSED*).
  - **Crash Circuit-Breaker**: Jika terjadi error runtime pada antarmuka web, sistem menampilkan layar netral *"Layar sedang dipulihkan"* dan me-reload setelah 10 detik. Jika reload terjadi 3 kali dalam 1 jam, auto-reload dihentikan dan sistem tetap berada di layar netral sembari mencoba polling data hingga pulih.
  - **Penyelarasan Rilis Baru**: Jika terdapat build baru di server, TV akan me-reload otomatis tepat pada pergantian ketukan waktu berikutnya.
  - **Penyegaran Rutin**: Auto-reload terjadwal setiap hari pada pukul 03.00 WIB dini hari.
  - Kiosk Hardening: Kursor disembunyikan, seleksi teks dan dialog popup browser dinonaktifkan, serta fitur *screen wake lock* aktif.

#### [F14 — Notifikasi & Observabilitas](file:///mnt/data/Projects/Web/React/lobby-dashboard/docs/specs/F14-notifikasi.md)
* **Tujuan**: Mengirim peringatan dini proaktif via bot Telegram ke pihak yang tepat saat terjadi anomali sistem.
* **Dua Jalur Peringatan**:
  1. **Ke Tim Teknis (Masalah Server/Upstream)**: Dipicu jika sebuah modul upstream gagal 5 kali berturut-turut. Dilengkapi pesan pengingat setiap 6 jam jika belum tertangani, dan notifikasi pemulihan saat koneksi normal kembali.
  2. **Ke Admin Desa (Masalah Perangkat TV Fisik)**: Dipicu jika perangkat TV tidak terdeteksi melakukan polling > 5 menit **hanya selama jam kerja operasional desa** (Senin–Jumat, pukul 07.00–16.00 WIB).
* **Format Pesan**: Pesan untuk admin desa disusun dengan bahasa santun dan instruksi perbaikan fisik sederhana (mis. *"Layar TV lobby tidak tersambung... Coba cabut-colok perangkat TV dan cek WiFi"*), bebas dari istilah teknis atau cuplikan error server.

---

## 4. Matriks Keterkaitan Antar-Spesifikasi

| Fitur | Kategori | Sumber Data | Tipe Tampilan di TV | Perilaku Saat Stale/Unavailable | Relasi Spesifikasi Terkait |
|---|---|---|---|---|---|
| **F01** | Keselamatan | SIGAP | Card Statis (Kolom Kiri) | Pertahankan Siaga/Awas (Stale-Hold) / Abu-abu UNKNOWN | F02, F03, F12 |
| **F02** | Darurat | SIGAP / Config | Layar Penuh (Takeover) | Histeresis 2x sinkron segar; Notice 10 mnt | F01, F03, F12 |
| **F03** | Informasi | SID / Config | Bar Bawah Bergerak | Mode disesuaikan status (Override / Priority / Normal) | F01, F02 |
| **F04** | Cuaca | SIGAP (Open-Meteo) | Card Berotasi (3 Hari) | "Belum ada informasi terbaru" (tanpa data lama) | F10, F12 |
| **F05** | Gempa | SIGAP | Card Statis (Kolom Kiri) | Redup jika > 24 jam; Teks per HH.MM | F06, F12 |
| **F06** | Gempa | SIGAP | Card Berotasi (3 baris/page) | Deduplikasi Jabar; Data terakhir + per HH.MM | F05, F10, F12 |
| **F07** | Demografi | SID | Card Statis + Rotasi (3 slide) | Gating publikasi; Penyamaran angka < 10 | F10, F12 |
| **F08** | Pelayanan | SID | Card Berotasi (1–2 slide) | Hitung selesai terminal; Tren 12 minggu; Allowlist | F10, F12 |
| **F09** | Ekonomi | CiMart | Card Berotasi (Produk + Edukasi) | Fase 0 (Ajakan) vs Fase 1 (Katalog); Thumbnail WebP | F10, F11, F12 |
| **F10** | Mesin UI | Jam Server | Pengatur Rotasi Global | Histeresis transisi perubahan jumlah slide $n$ | F04, F06, F07, F08, F09 |
| **F11** | Mobile | Agregator | Halaman Web Responsif | Non-rotasi; Pause saat blur; Tombol perbarui manual | F01–F05, F09 |
| **F12** | Fondasi | Semua Upstream | Mesin Siklus Hidup | OK $\to$ Stale $\to$ Unavailable; Exponential Backoff | Seluruh Fitur |
| **F13** | Hardware/OS | Browser TV | Shell Kiosk & Recovery | Cache offline; Crash breaker 3x/jam; Daily reload | F12, F14 |
| **F14** | Pemantauan | Bot Telegram | Pesan Siaga Eksternal | Pemisahan target Tim Teknis vs Admin Desa Jam Kerja | F12, F13 |

---

## 5. Ringkasan Ketentuan Teknis & Batasan Arsitektur

1. **Integritas Waktu (Timezone)**:
   - Seluruh logika tanggal dan jam berjalan menggunakan waktu Indonesia Barat (**WIB**, `Asia/Jakarta`).
   - Jam TV disinkronkan dengan jam server aggregator (`server_time`), kebal terhadap deviasi jam internal perangkat TV/kiosk.
2. **Kualitas dan Pengujian Kode**:
   - Seluruh aturan bisnis wajib memiliki pengujian otomatis (*table-driven unit test*) di `@lobby/core` mencakup skenario batas dan kasus kegagalan.
   - Panggilan ke sistem upstream dalam unit test wajib menggunakan data tiruan (*fixture*), dilarang menyentuh jaringan luar secara langsung.
3. **Standar Aksesibilitas & Tampilan**:
   - Tampilan visual saat ini dijaga netral dan fungsional sesuai rancangan awal sebelum penerbitan tiket pemolesan desain akhir.
   - Tidak ada elemen yang berkedip atau bergerak terus-menerus kecuali running text (F03).
   - Card berotasi berpindah slide serempak tanpa animasi transisi panjang yang memberatkan pemroses TV hemat daya.
