# F03 — Running Text

| | |
|---|---|
| Diimplementasikan di | SID-02 FR-3 (pengumuman); LOBBY-01 FR-7 (`tips`); LOBBY-02 §B (`ticker_mode`); LOBBY-03 FR-C1; LOBBY-04 FR-4 |
| Keputusan | PRD §5.2, K-A6, K-A19, K-N10, default B19 |
| Terkait | F01, F02 |

## Ringkasan

Bar bawah selebar layar berisi teks berjalan bergaya berita TV. Isinya diprioritaskan: peringatan SIGAP, lalu pengumuman desa, lalu tips kesiapsiagaan sebagai pengisi.

## Aturan perilaku

- R-1 (mode): level tampil ORANGE/RED (termasuk hasil tahan F01) → `override`; YELLOW → `priority`; GREEN/UNKNOWN → `normal`.
- R-2 (`override`): hanya item peringatan `"<LABEL>: <alasan>"`. Untuk RED, tambahkan `"Titik kumpul: <nama1>, <nama2>, <nama3>"`.
- R-3 (`priority`): peringatan, lalu pengumuman, lalu tips.
- R-4 (`normal`): pengumuman, lalu tips.
- R-5 (notice F02): selama berlaku, notice selalu menjadi item pertama di mode apa pun.
- R-6 (pengumuman): berita SID yang terbit, berkategori pengumuman (slug dari config SID, default `pengumuman`), terbit ≤ 30 hari, maks 5, urut terbaru. Format `"PENGUMUMAN: <judul> (<tanggal WIB>)"`. Hanya judul, tanpa isi berita.
- R-7 (tips): dari config aggregator, minimal 3 item. Tips tidak boleh berbunyi seolah kondisi sedang aman (mis. "Kondisi aman").
- R-8: Running text tidak pernah kosong.
- R-9: Running text tetap berjalan di layar Awas.

## Non-functional requirements

- NFR-1: Animasi memakai CSS `transform`; satu-satunya gerakan kontinu di layar TV.
- NFR-2: Susunan item berasal dari satu fungsi murni `buildTicker` (`@lobby/core`) yang dipakai TV.

## Acceptance criteria

- AC-F03-1 [LOBBY-03]: Test tabel `buildTicker` untuk mode normal, priority, override ORANGE, override RED, dan dengan notice; hasil tidak pernah kosong.
- AC-F03-2 [SID-02]: Pengumuman berumur 31 hari, berita tanpa kategori pengumuman, dan berita belum terbit tidak dikirim; maksimal 5.
- AC-F03-3 [LOBBY-03]: Skenario `orange` → running text tidak memuat pengumuman maupun tips.
- AC-F03-4 [LOBBY-03]: Skenario `yellow` → item pertama adalah peringatan, lalu pengumuman.
- AC-F03-5 [LOBBY-01]: Config dengan kurang dari 3 tips ditolak saat start.

## Aturan / larangan

- Jangan menampilkan isi berita, nama penulis, atau data pemohon.
- Jangan memakai warna status untuk running text di luar mode Awas.

## Di luar lingkup v1

Running text yang diketik manual oleh admin desa; pengumuman terjadwal.
