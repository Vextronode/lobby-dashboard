# F01 — Status Kesiapsiagaan

| | |
|---|---|
| Diimplementasikan di | SIGAP-01 §A; LOBBY-02 §B; LOBBY-03 FR-A3, FR-B2; LOBBY-04 FR-2 |
| Keputusan | PRD §5.3, K-A5, K-N1, K-N3 |
| Terkait | F02 (Awas), F03 (running text), F12 (kesegaran) |

## Ringkasan

Card Status menampilkan level kesiapsiagaan platform SIGAP untuk Desa Cibenda dan selalu terlihat (tidak ikut rotasi). Prinsip utamanya: **layar tidak pernah mengatakan "Aman" kalau sistem sebenarnya tidak tahu**, dan **peringatan berbahaya tidak pernah hilang hanya karena koneksi putus**.

## Aturan perilaku

- R-1: Level berasal dari `GET /api/public/alerts/current` SIGAP (level platform, bukan indikator alat IoT).
- R-2: Level mentah = `UNKNOWN` jika salah satu benar: `basis === "fallback"`; `id === "baseline-safe"`; nilai `level` di luar GREEN/YELLOW/ORANGE/RED. Selain itu level mentah = `level` dari SIGAP.
- R-3: `last_known` = level mentah terakhir yang bukan `UNKNOWN`, beserta waktunya.
- R-4: Data status **basi** jika umur sejak sinkron berhasil terakhir > 180 dtk (3 × interval 60 dtk), atau belum pernah berhasil.
- R-5 (tahan): jika data basi **atau** level mentah `UNKNOWN`, **dan** `last_known` ≥ ORANGE dengan umur ≤ 24 jam, maka level tampil = `last_known` dan ditandai "ditahan".
- R-6: Semua kondisi basi/`UNKNOWN` lain → level tampil `UNKNOWN`.
- R-7: Selain kondisi di atas, level tampil = level mentah.
- R-8: Alasan: `description` dari SIGAP jika ada dan alert tidak `expired`. Jika tidak ada: GREEN → "Tidak ada peringatan aktif"; UNKNOWN → "Status tidak dapat dipastikan".
- R-9: Kadaluarsa alert (24 jam atau review ditolak → GREEN) adalah keputusan SIGAP dan diterima apa adanya (K-N3).
- R-10: Klien juga menjaga dirinya sendiri: jika poll status terakhir yang berhasil > 90 dtk lalu, klien menerapkan R-5/R-6 memakai level tampil terakhir yang diterimanya.
- R-11: Waktu yang ditampilkan memakai jam server yang dikoreksi, dalam WIB.

## State & tampilan

| Level tampil | Label | Ikon | Tambahan |
|---|---|---|---|
| GREEN | Aman | Lingkaran centang | — |
| YELLOW | Waspada | Segitiga | Card berwarna kuning |
| ORANGE | Siaga | Wajik | Card oranye; running text ditimpa (F03) |
| RED | Awas | Oktagon | Layar penuh (F02) |
| UNKNOWN | Data tidak terkini | Netral | Abu-abu, tanpa warna status |
| Ditahan (R-5) | Label level yang ditahan | Ikon level | Baris "Terakhir diperbarui HH.MM, data mungkin tidak terkini" |

## Non-functional requirements

- NFR-1: Perubahan level di SIGAP terlihat di TV dalam ≤ 80 dtk (≤ 60 dtk sinkron + ≤ 20 dtk poll).
- NFR-2: Logic R-2 s.d. R-8 adalah satu fungsi murni (`@lobby/core`) yang dipakai aggregator dan klien.

## Acceptance criteria

- AC-F01-1 [LOBBY-02, LOBBY-03]: Respons SIGAP `baseline-safe` (dengan atau tanpa field `basis`) → tampil "Data tidak terkini", tidak pernah "Aman".
- AC-F01-2 [LOBBY-02]: ORANGE segar lalu SIGAP mati 10 menit → tetap Siaga dengan label "Terakhir diperbarui".
- AC-F01-3 [LOBBY-02]: YELLOW lalu SIGAP mati 4 menit → "Data tidak terkini".
- AC-F01-4 [LOBBY-02]: ORANGE lalu SIGAP mati > 24 jam → "Data tidak terkini".
- AC-F01-5 [LOBBY-03]: Aggregator tidak bisa dihubungi > 90 dtk saat GREEN → TV tampil "Data tidak terkini"; saat ORANGE → tetap Siaga dengan label.
- AC-F01-6 [LOBBY-03, LOBBY-04]: Pada skenario `sigap-fallback` dan `sigap-down`, kata "Aman" tidak muncul di halaman.
- AC-F01-7 [SIGAP-01]: SIGAP mengirim `basis: "fallback"` pada kedua jalur fallback.

## Aturan / larangan

- Jangan pernah menampilkan GREEN/"Aman" karena data tidak tersedia, gagal, atau tidak dikenal.
- Warna status hanya di card Status dan layar Awas, tidak di elemen lain.
- Jangan memakai `/device/status` atau `/system-health` SIGAP.

## Di luar lingkup v1

Rekomendasi AI SIGAP; indikator per alat IoT; status per dusun.
