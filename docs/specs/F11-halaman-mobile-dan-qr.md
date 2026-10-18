# F11 — Halaman Mobile, QR & Aplikasi Desa

| | |
|---|---|
| Diimplementasikan di | LOBBY-01 FR-7 (`public_url`, `app_links`); LOBBY-03 §D; LOBBY-04 |
| Keputusan | PRD §6, K-A13 |
| Terkait | F01–F05, F09 |

## Ringkasan

Warga memindai QR di TV dan membuka halaman ringkas di HP: status kesiapsiagaan, cuaca, gempa terakhir, satu pengumuman, produk CiMart, dan tautan ke tiga aplikasi desa. Halaman ini sekaligus menjadi "halaman daftar 3 aplikasi desa" yang disebut PRD.

## Aturan perilaku

- R-1 (QR): QR di bar bawah TV berisi `public_url` (halaman mobile). QR dibuat di klien, tanpa layanan eksternal.
- R-2 (urutan bagian): (1) status, (2) cuaca 3 hari + gempa Pangandaran terakhir, (3) satu pengumuman teratas, (4) produk CiMart, (5) Aplikasi Desa.
- R-3 (Awas): saat Awas, banner F02 tampil di atas semua bagian.
- R-4 (pengumuman): satu pengumuman terbaru (judul + tanggal). Tidak ada → bagian disembunyikan.
- R-5 (Aplikasi Desa): tiga kartu dari config: "Buka SIGAP", "Ajukan Surat (SID)", "Belanja di CiMart", masing-masing dengan satu kalimat penjelasan. Bisa dibuka langsung lewat `/#aplikasi`.
- R-6: Data penduduk dan layanan surat tidak ditampilkan di mobile.
- R-7: Tidak ada rotasi otomatis. Tombol "Perbarui" memanggil ulang data.
- R-8: Poll berhenti saat tab tidak terlihat dan lanjut saat terlihat lagi.
- R-9: Tautan keluar terbuka di tab yang sama.
- R-10: Tanpa analytics, pixel, atau cookie.

## Non-functional requirements

- NFR-1: LCP < 3 dtk di profil jaringan "Slow 4G".
- NFR-2: Lebar minimum 320 px tanpa scroll horizontal; target sentuh ≥ 48 px.
- NFR-3: Tanpa pelanggaran aksesibilitas serius (axe).

## Acceptance criteria

- AC-F11-1 [LOBBY-03]: QR di TV, saat dipindai, membuka `public_url`.
- AC-F11-2 [LOBBY-04]: `/#aplikasi` langsung menuju bagian Aplikasi Desa dengan tiga tautan dari config.
- AC-F11-3 [LOBBY-04]: Tidak ada scroll horizontal di 320 px pada semua skenario.
- AC-F11-4 [LOBBY-04]: Tab tersembunyi 5 menit → tidak ada request poll.
- AC-F11-5 [LOBBY-04]: Tidak ada bagian penduduk atau surat di halaman.

## Aturan / larangan

- Jangan menambah formulir, login, atau interaksi yang mengubah data.

## Di luar lingkup v1

Notifikasi push; mode offline penuh di HP; bahasa selain Indonesia.
