# F02 — Layar Awas & Pencabutan

| | |
|---|---|
| Diimplementasikan di | LOBBY-02 §B, FR-A5 (`preparedness`); LOBBY-03 FR-C2, FR-C3; LOBBY-04 FR-3 |
| Keputusan | PRD §5.3, K-A7, K-A19 |
| Terkait | F01, F03 |

## Ringkasan

Saat level tampil RED (Awas), TV berhenti merotasi dan mengganti seluruh layar dengan informasi keselamatan: level, alasan, titik kumpul, dan kontak darurat. Mode ini masuk dengan cepat dan keluar dengan hati-hati, supaya layar tidak berkedip saat level SIGAP naik-turun.

## Aturan perilaku

- R-1 (masuk): `awas = true` begitu level tampil (F01) = RED.
- R-2 (keluar): `awas` kembali `false` hanya setelah **2 sinkron berhasil, segar, dan berturut-turut** dengan level mentah yang diketahui < RED. Selama hitungan belum tercapai, level tampil tetap RED.
- R-3: Data basi atau level `UNKNOWN` mereset hitungan R-2 ke 0. Karena aturan tahan F01 R-5, Awas tetap aktif selama data basi hingga 24 jam.
- R-4 (notice): saat `awas` berubah `true → false`, tampil notice "Status Awas telah dicabut, kini: <Label>" selama 10 menit (F03).
- R-5: State Awas (hitungan dan notice) bertahan walau aggregator di-restart.
- R-6 (titik kumpul): daftar ID manual dari config (urutan config, maks 3). Jika config kosong, pakai titik `isCore = true` dari SIGAP sesuai urutan SIGAP (maks 3). Tidak ada perhitungan jarak.
- R-7 (kontak): kontak darurat `isCore` lebih dulu, maks 4.

## State & tampilan

| Kondisi | TV | Mobile |
|---|---|---|
| `awas = true` | Layar penuh: AWAS, alasan, titik kumpul (nama + alamat jika ada), kontak (instansi + nomor), waktu pembaruan. Rotasi berhenti; running text mode override. | Banner merah di paling atas: AWAS, alasan, titik kumpul, kontak sebagai tautan `tel:`. |
| `awas` baru berakhir | Kembali ke tata letak normal pada ketukan berikutnya; notice di running text 10 menit. | Notice di bawah status 10 menit. |
| Titik kumpul tidak tersedia | Bagian titik kumpul menampilkan "Ikuti arahan petugas desa". | Sama. |

## Non-functional requirements

- NFR-1: TV masuk mode Awas ≤ 80 dtk setelah SIGAP berubah ke RED.

## Acceptance criteria

- AC-F02-1 [LOBBY-02]: RED → ORANGE: setelah 1 sinkron masih Awas; setelah 2 sinkron keluar dan notice "Status Awas telah dicabut, kini: Siaga" berlaku 10 menit.
- AC-F02-2 [LOBBY-02]: RED lalu SIGAP mati → tetap Awas (≤ 24 jam).
- AC-F02-3 [LOBBY-02]: RED → restart aggregator → tetap Awas sebelum sinkron pertama selesai.
- AC-F02-4 [LOBBY-02]: Config titik kumpul kosong → titik `isCore` (maks 3); config `["id-b","id-a"]` → urutan b, a.
- AC-F02-5 [LOBBY-03]: Skenario `red` → layar penuh tampil dan rotasi berhenti; skenario `red-then-orange` → kembali normal dengan notice.
- AC-F02-6 [LOBBY-04]: Skenario `red` → banner di atas dengan tautan `tel:` yang benar.
- AC-F02-7 [LOBBY-05]: Uji dev ujung ke ujung: RED → layar Awas ≤ 80 dtk.

## Aturan / larangan

- Jangan memicu RED di SIGAP produksi untuk menguji; pakai mock.
- Jangan menampilkan titik kumpul yang tidak berasal dari SIGAP.

## Di luar lingkup v1

Suara/alarm; titik kumpul terdekat berdasarkan lokasi HP pengguna; jalur evakuasi di peta.
