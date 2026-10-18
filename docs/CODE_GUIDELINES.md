# Code Guidelines — Lobby Dashboard & Public Summary Module

Berlaku untuk semua tiket di `prd/tickets/`. Untuk repo `lobby-dashboard`, salin file ini ke `docs/CODE_GUIDELINES.md` dan rujuk dari `CLAUDE.md` di root repo (LOBBY-01).

**Urutan prioritas jika ada konflik:**
1. Aturan keamanan & privasi (§2), selalu menang.
2. Konvensi repo yang sudah ada. Di SIGAP, SID, dan CiMart, ikuti gaya kode sekitarnya meskipun berbeda dari dokumen ini; jangan "merapikan" kode lama di luar lingkup tiket.
3. Dokumen ini.

Bagian berlabel **WAJIB** dicek di review. Bagian lain adalah praktik yang dianjurkan; menyimpang boleh dengan alasan yang ditulis di Laporan tiket.

---

## 1. Prinsip umum

1. **Benar dulu, lalu jelas, lalu ringkas.** Kode yang mudah dibaca lebih penting daripada kode pendek. Abstraksi baru hanya dibuat jika sudah dipakai di ≥ 2 tempat atau jelas menyederhanakan test.
2. **Satu fungsi, satu tanggung jawab** (WAJIB untuk logic di `packages/core`). Ukurannya bukan jumlah baris, tapi apakah nama fungsi menjelaskan seluruh isinya. Jangan memecah fungsi menjadi potongan 3 baris yang hanya dipanggil sekali; itu justru menyulitkan pembacaan.
3. **Pisahkan logic dari I/O.** Aturan bisnis dan kebijakan tampilan berbentuk fungsi murni: input → output, tanpa jaringan, file, jam sistem, atau DOM. I/O tinggal di lapisan tipis di luarnya. Waktu "sekarang" selalu masuk sebagai parameter (`now: Date`), tidak memanggil `Date.now()` di dalam logic.
4. **Gagal dengan jelas, di tepi sistem.** Validasi semua data yang masuk dari luar (respons upstream, config, env, query string) di titik masuk. Setelah lolos validasi, kode di dalam boleh mempercayai tipenya.
5. **Tidak ada angka atau teks ajaib.** Interval, ambang, batas, dan teks untuk warga diambil dari config atau konstanta bernama. Teks yang tampil ke warga hanya di `copy/id.ts` (web) atau file terjemahan/config yang setara.
6. **YAGNI.** Jangan membangun fitur, opsi config, atau titik ekstensi yang tidak diminta tiket. Pengecualian yang disengaja tertulis di tiket (mis. interface `CacheStore` dan `Notifier`).
7. **Lebih baik kode dihapus daripada dikomentari.** Tidak ada blok kode mati, `console.log` sisa debugging, atau TODO tanpa nomor tiket.

## 2. Keamanan & privasi (WAJIB)

1. Tidak ada endpoint tulis (POST/PUT/PATCH/DELETE) baru di lapisan mana pun.
2. Data yang keluar dari SID dan CiMart selalu melalui **whitelist eksplisit** (API Resource / `select` kolom). Tidak pernah mengirim model Eloquent mentah, `toArray()`, atau `$model->load(...)` ke respons publik.
3. Tidak ada PII di respons, log, fixture, maupun pesan error: NIK, KK, nama warga, alamat, tanggal lahir individual, penghasilan, kontak pribadi penjual/pembeli.
4. Kelompok < 10 disamarkan **di sumber** (SID), sesuai tiket.
5. `family_socioeconomics` tidak pernah di-query oleh kode publik. Ada test yang memeriksanya.
6. Rahasia (token, URL internal) hanya dari env. Tidak pernah di repo, log, respons `/meta`, atau pesan error.
7. URL yang diunduh server (thumbnail) dibatasi ke origin yang diizinkan, dengan timeout dan batas ukuran.
8. Respons error ke klien tidak memuat stack trace, query, path file, atau nama env.
9. Dependensi baru hanya dari paket yang terawat dan banyak dipakai. Sebutkan setiap dependensi baru beserta alasannya di Laporan.

## 3. Penamaan

| Hal | Aturan | Contoh |
|---|---|---|
| Bahasa identifier & komentar | Inggris | `evaluateStatus`, `staleHold` |
| Teks yang tampil ke warga | Bahasa Indonesia, terpusat | `copy.status.unknown = "Data tidak terkini"` |
| Istilah domain | Satu istilah untuk satu konsep, sama di semua lapisan | `level` (bukan campuran `status`/`tier`), `module`, `envelope`, `beat` |
| Boolean | Awali `is`/`has`/`should` atau berupa kata sifat jelas | `isStale`, `hasPhotos`, `awas` (istilah domain, dibiarkan) |
| Fungsi | Kata kerja + objek | `buildTicker`, `fetchPopulation` |
| File TS | kebab-case; komponen React PascalCase | `status-policy.ts`, `StatusCard.tsx` |
| PHP | Ikuti PSR-12 dan konvensi Laravel repo | `LobbyPopulationService` |
| Satuan | Masukkan satuan di nama jika berupa angka | `intervalS`, `maxAgeS`, `timeoutMs`, `ageS` |
| Field JSON di kabel | snake_case (sesuai kontrak) | `fetched_at`, `age_s` |

Hindari singkatan kecuali yang umum (`id`, `url`, `api`). Nama yang lebih panjang tapi jelas lebih baik daripada komentar yang menjelaskan nama pendek.

## 4. Komentar & dokumentasi

1. Komentar menjelaskan **mengapa**, bukan **apa**. Contoh yang baik: `// SIGAP returns GREEN when it cannot evaluate; treat as unknown (K-N1).`
2. Setiap aturan yang berasal dari spec atau keputusan produk diberi rujukan (`F01 R-5`, `K-N9`) agar bisa dilacak ke `specs/` atau `02-keputusan-final.md`.
3. Fungsi publik di `packages/core` dan `packages/contract` diberi TSDoc singkat: tujuan, aturan khusus, dan contoh input/output jika tidak jelas.
4. Perubahan perilaku atau keputusan teknis baru dicatat sebagai ADR singkat di `docs/adr/` (konteks, keputusan, konsekuensi).

## 5. TypeScript (repo `lobby-dashboard`)

1. `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. **WAJIB**: tanpa `any`. Gunakan `unknown` lalu persempit. `// @ts-expect-error` hanya dengan alasan di baris yang sama.
2. Tipe data berasal dari skema Zod (`z.infer`). Jangan menulis interface kedua untuk bentuk yang sama.
3. Gunakan union literal dan `switch` yang exhaustive (`assertNever`) untuk state seperti `ModuleState`, `Level`, `ticker_mode`. Menambah nilai baru harus membuat compile gagal di semua tempat yang belum menanganinya.
4. Kegagalan yang **diharapkan** (upstream timeout, skema tidak valid) dikembalikan sebagai nilai (`Result<T, FetchError>`), bukan exception. Exception hanya untuk bug dan kondisi yang tidak mungkin.
5. Data immutable secara default (`readonly`, `as const`). Logic di `core` tidak memutasi input.
6. `async` selalu ditunggu atau ditangani secara eksplisit. ESLint `no-floating-promises` aktif.
7. Ekspor bernama, tanpa `export default` (kecuali yang diwajibkan tool, mis. config Vite).
8. Import antar paket lewat nama paket (`@lobby/core`), bukan path relatif lintas paket.

## 6. Aggregator (Node + Hono)

1. Struktur mengikuti `03-struktur-folder.md`. Setiap sumber (`sources/sigap`, …) hanya mengurus HTTP + validasi + pemetaan ke tipe kontrak.
2. Setiap panggilan HTTP keluar punya timeout eksplisit dan `AbortController`. Tidak ada retry di dalam satu siklus; retry diatur scheduler/circuit breaker.
3. Timer (`setTimeout`) disimpan dan dibersihkan saat shutdown. Tangani `SIGTERM`: hentikan scheduler, tulis snapshot terakhir, tutup server.
4. Log terstruktur dengan pino: satu event = satu baris JSON, field konsisten (`module`, `latency_ms`, `error_kind`). Level: `error` (bug / butuh tindakan), `warn` (degradasi), `info` (siklus hidup), `debug` (detail pengembangan). Tidak me-log payload.
5. Handler HTTP tipis: baca dari cache, panggil fungsi murni, kembalikan respons. Tidak ada logic bisnis di handler.

## 7. React (apps/web)

1. Komponen fungsi + hooks. Komponen presentasi menerima props yang sudah siap tampil; logic (rotasi, ticker, freshness) dipanggil dari `@lobby/core` di hook atau di atas komponen.
2. Satu komponen per file. Komponen > 150 baris adalah sinyal untuk dipecah menurut bagian UI, bukan menurut jumlah baris.
3. State global tidak dipakai. Data API dikelola satu hook polling per endpoint (`usePoll`) dan diturunkan lewat props atau satu context kecil.
4. `useEffect` hanya untuk sinkronisasi dengan dunia luar (timer, polling, service worker). Nilai turunan dihitung saat render atau dengan `useMemo` bila mahal.
5. Setiap state modul (`loading`, `ok`, `stale`, `unavailable`) punya tampilan eksplisit. Tidak ada cabang yang diam-diam merender `null` tanpa alasan.
6. Aksesibilitas (mobile): elemen interaktif semantik (`<a>`, `<button>`), label jelas, kontras cukup, target sentuh ≥ 48 px.
7. Tidak ada styling final sebelum tiket desain (tampilan ditahan). Gunakan CSS Modules atau CSS biasa dengan token di `design/`; tanpa CSS framework.

## 8. Laravel (SID, CiMart)

1. Ikuti pola repo: Controller → Service → Repository (SID) / Controller tipis (CiMart) → API Resource.
2. Controller hanya: validasi request (Form Request), panggil service, kembalikan Resource. Query ada di service/repository.
3. Query agregat memakai query builder dengan kolom eksplisit. Hindari memuat model penuh untuk menghitung. Untuk data besar, gunakan `cursor()`/`chunk()`.
4. Query harus portabel jika test memakai SQLite (SID): hindari fungsi khusus PostgreSQL/MySQL; hitung tanggal/zona waktu di PHP (Carbon dengan `Asia/Jakarta`), lalu kirim batas UTC ke `WHERE`.
5. Config lewat `config/lobby.php` yang membaca `env()`. Kode di `app/` hanya memanggil `config()`.
6. Cegah N+1: eager load yang dibutuhkan saja, dan tambahkan test jumlah query bila tiket memintanya.
7. Rate limiter didefinisikan di `AppServiceProvider` dengan nama yang menjelaskan konsumennya (`lobby-public`).
8. Jangan mengubah migration, model, atau perilaku endpoint lama di luar lingkup tiket.

## 9. Express + Prisma (SIGAP)

1. Ikuti lapisan yang ada: route → controller → service → repository, dan tipe di `types/`.
2. Perubahan respons bersifat aditif (field baru opsional). Endpoint baru memakai envelope standar `{ success, message, data }` / `{ success, message, errors }`.
3. Endpoint baca tidak boleh menulis ke database.
4. Panggilan ke BMKG di test selalu di-mock memakai fixture.

## 10. Testing

1. **WAJIB:** setiap Acceptance Criteria di tiket, termasuk AC spec (`AC-Fxx-n`) yang dicantumkan tiket, punya minimal satu test otomatis, kecuali yang ditandai manual. Nama test merujuk AC (`it('AC-F02-1: exits Awas after two calm syncs')`).
2. Logic murni diuji dengan **test tabel** (daftar input → output yang diharapkan), termasuk kasus batas: tepat di ambang, tepat lewat ambang, data kosong, nilai tak dikenal, pergantian bulan/minggu di zona WIB.
3. Waktu dikendalikan di test (`vi.useFakeTimers` / `Carbon::setTestNow` / jam yang disuntikkan). Tidak ada `sleep` sungguhan.
4. Test tidak memanggil jaringan sungguhan. Upstream diganti mock/fixture dari `packages/contract/fixtures`.
5. Test privasi (SID, CiMart) memeriksa respons secara rekursif terhadap daftar key terlarang dan memeriksa log query.
6. Test E2E (Playwright) menyimpan screenshot per skenario sebagai artefak CI.
7. Test harus deterministik. Test yang kadang gagal diperbaiki, tidak di-skip.

## 11. Error handling & observability

| Situasi | Perlakuan |
|---|---|
| Upstream timeout / 5xx / skema tidak valid | Nilai `FetchError`, dicatat `warn`, modul memakai data lama sesuai aturan freshness. |
| Config tidak valid saat start | Proses keluar dengan kode ≠ 0 dan pesan yang menyebut field. |
| Bug (kondisi yang seharusnya mustahil) | Lempar error, tangkap di batas proses/request, log `error`. Klien menerima 500 generik. |
| Error di browser TV | Error boundary + reload terkendali (LOBBY-03), tanpa pesan teknis di layar. |

## 12. Git, commit, dan PR

1. Satu branch per tiket: `feat/<ticket-id>-<ringkas>`, mis. `feat/sid-01-population-summary`.
2. Commit kecil dan bermakna, format Conventional Commits dengan ID tiket: `feat(sid): add lobby population endpoint [SID-01]`. Tipe: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
3. PR merujuk tiket, berisi ringkasan, cara menguji, dan bagian Laporan tiket yang sudah diisi. PR tidak mencampur refactor besar dengan fitur.
4. CI hijau (lint, typecheck/pint/phpstan bila ada, test, build) sebelum review.
5. Tidak ada commit langsung ke branch utama.

## 13. Formatting & linting

| Repo | Alat |
|---|---|
| `lobby-dashboard` | Prettier (lebar 100) + ESLint (`typescript-eslint` strict-type-checked, `react-hooks`, `no-floating-promises`, `import/no-cycle`) |
| SID, CiMart | Laravel Pint (jika sudah ada di repo), PSR-12 |
| SIGAP | Konfigurasi lint/format yang sudah ada di repo |

Formatter dijalankan otomatis (pre-commit atau CI). Diskusi gaya yang bisa diselesaikan formatter tidak dibahas di review.

## 14. Checklist review (salin ke PR)

- [ ] Semua AC tiket dan AC spec yang dicantumkan punya bukti (test/screenshot), dan bagian Laporan terisi.
- [ ] Tidak ada endpoint tulis baru; tidak ada PII di respons, log, atau fixture.
- [ ] Data dari luar divalidasi di titik masuk; tidak ada `any`.
- [ ] Logic baru berupa fungsi murni dengan test tabel, termasuk kasus batas waktu WIB.
- [ ] Tidak ada angka/teks ajaib; teks warga terpusat dalam Bahasa Indonesia.
- [ ] Aturan dari spec/keputusan diberi rujukan `Fxx R-n` / `K-…`.
- [ ] Tidak ada perubahan di luar lingkup tiket; dependensi baru disebutkan beserta alasannya.
- [ ] CI hijau.
