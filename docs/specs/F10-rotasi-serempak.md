# F10 — Rotasi Serempak 15 Detik

| | |
|---|---|
| Diimplementasikan di | LOBBY-03 FR-B1 |
| Keputusan | PRD §5.5, K-A17, default B10–B11 |
| Terkait | F04, F06, F07, F08, F09 |

## Ringkasan

Semua card yang berotasi di TV berganti slide bersamaan pada satu "ketukan" setiap 15 detik. Di antara ketukan layar diam, kecuali running text. Rotasi ditentukan dari jam, sehingga beberapa TV menampilkan slide yang sama dan reload melanjutkan posisi yang sama.

## Aturan perilaku

- R-1: `ketukan = floor(jam_server_terkoreksi / 15.000 ms)`.
- R-2: Setiap card berotasi punya `n` slide (ditentukan dari data, lihat spec masing-masing). Slide yang tampil = `ketukan mod n`.
- R-3: Data baru dengan `n` sama diterapkan pada ketukan berikutnya.
- R-4: Data baru yang mengubah `n` ditahan dan baru diterapkan pada ketukan pertama dengan `ketukan mod n_baru = 0`, supaya slide tidak meloncat di tengah siklus.
- R-5: Card dengan `n = 1` tidak berotasi.
- R-6: Card yang tidak pernah berotasi: Status (F01), Gempa Pangandaran (F05), Penduduk (F07).
- R-7: Saat layar Awas aktif (F02), rotasi berhenti.
- R-8: Pergantian slide adalah satu-satunya perubahan tampilan pada ketukan; tanpa animasi panjang.

## Jumlah slide per card

| Card | n |
|---|---|
| Prakiraan cuaca | 3 (1 jika basi/tidak tersedia) |
| Gempa Jabar/Indonesia | `ceil(item / 3)` halaman (1 pada mode cadangan) |
| Etalase CiMart | Fase 1: produk + 1; Fase 0: 3; tidak tersedia: 1 |
| Profil Warga | 3 (1 jika belum dipublikasikan/tidak tersedia) |
| Layanan Surat | 2 (1 jika jenis terbanyak kosong) |

## Acceptance criteria

- AC-F10-1 [LOBBY-03]: Test tabel indeks untuk ketukan 0..17 dengan n = 3, 2, 9.
- AC-F10-2 [LOBBY-03]: Perubahan n 3 → 2 diterapkan tepat pada ketukan pertama dengan `ketukan mod 2 = 0`.
- AC-F10-3 [LOBBY-03]: Dua tab yang dibuka pada waktu berbeda menampilkan slide yang sama pada ketukan yang sama.
- AC-F10-4 [LOBBY-03]: Jam perangkat meleset +2 jam → rotasi tetap sinkron dengan TV lain (memakai jam server).

## Aturan / larangan

- Jangan memakai `setInterval` tanpa penyelarasan ke batas ketukan.
- Jangan membuat card berotasi dengan kecepatan berbeda.

## Di luar lingkup v1

Durasi ketukan berbeda per card; transisi beranimasi.
