# F09 — Etalase CiMart

| | |
|---|---|
| Diimplementasikan di | CIMART-01; LOBBY-02 FR-A5 (`cimart`), §D; LOBBY-03 FR-B2; LOBBY-04 FR-2 |
| Keputusan | PRD §5.1, K-A8, K-A14, K-N11, K-N13 |
| Terkait | F10, F11, F12 |

## Ringkasan

Etalase produk UMKM desa di card CiMart (TV) dan carousel produk (mobile). Etalase punya dua fase: Fase 0 berupa ajakan saat produk belum cukup, dan Fase 1 berupa kartu produk nyata. Data dummy tidak pernah ditampilkan.

## Aturan perilaku

### Produk yang boleh tampil
- R-1: Produk mengikuti filter homepage CiMart: toko terverifikasi (`sid_status = verified`), pemilik berstatus `active` atau `warning`, produk aktif, stok > 0, terbaru dulu, maks 10 dari CiMart.
- R-2: Lobby menampilkan maksimal 8 produk.
- R-3: Field yang tampil hanya: nama produk, harga (Rupiah, mis. "Rp15.000"), satuan bila ada, nama toko, kategori, foto. Tidak ada alamat, kontak, atau koordinat toko.

### Fase
- R-4: Fase 1 jika modul `ok` atau `stale` dan jumlah produk ≥ 3 (config `phase1_min_products`). Selain itu Fase 0.
- R-5 (Fase 0, TV): 3 slide berotasi: "CiMart Segera Hadir"; "Apa itu CiMart?" (marketplace PWA untuk produk lokal warga dan wisatawan); "Punya usaha di Cibenda? Daftar lewat Surat Keterangan Usaha (SKU) dari Kantor Desa".
- R-6 (Fase 1, TV): satu produk per slide (≤ 8) ditambah 1 slide ajakan per siklus.
- R-7 (`unavailable`): satu slide umum "Belanja produk warga Cibenda di CiMart", tanpa kata "Segera hadir" (karena toko mungkin sudah berjalan).

### Foto
- R-8: Foto berasal dari thumbnail buatan aggregator (lebar 480 px, WebP), bukan langsung dari server CiMart.
- R-9: Produk tanpa foto, atau foto yang gagal diproses → ubin kategori (nama kategori + ikon dari slug). Tidak ada gating kualitas foto.
- R-10: Config `show_photos = false` mematikan semua foto (semua produk memakai ubin kategori).

### Mobile
- R-11: Carousel geser manual. Setiap produk menaut ke halaman detail produk di CiMart. Fase 0 dan `unavailable` memakai teks yang sama dengan R-5 dan R-7 dalam satu kartu.

## State & tampilan

| Kondisi | TV | Mobile |
|---|---|---|
| Fase 1 | Produk + slide ajakan | Carousel produk |
| Fase 0 | 3 slide R-5 | 1 kartu "Segera Hadir" + ajakan SKU |
| `stale` | Data lama, aturan fase tetap berlaku | Sama |
| `unavailable` | 1 slide R-7 | 1 kartu R-7 |

## Non-functional requirements

- NFR-1: Total gambar per kunjungan mobile ≤ 400 KB.
- NFR-2: Foto yang sama tidak diunduh ulang oleh aggregator.

## Acceptance criteria

- AC-F09-1 [CIMART-01]: Produk dari toko pending, pemilik suspended, produk nonaktif, atau stok 0 tidak dikirim.
- AC-F09-2 [CIMART-01]: Respons tidak memuat alamat, email, koordinat, ID pemilik, atau status verifikasi toko.
- AC-F09-3 [LOBBY-02]: 2 produk → Fase 0; 12 produk → Fase 1 dengan 8 produk.
- AC-F09-4 [LOBBY-02]: Foto rusak atau dari origin lain → tanpa foto, modul tetap `ok`.
- AC-F09-5 [LOBBY-03]: Fase 1 dengan 8 produk → 9 slide; Fase 0 → 3 slide.
- AC-F09-6 [LOBBY-03, LOBBY-04]: `unavailable` → tidak ada kata "Segera hadir".

## Aturan / larangan

- Jangan memakai data produk dummy di produksi.
- Jangan memuat foto asli CiMart langsung di TV atau HP.
- Jangan menambah kurasi manual (`is_featured`) di v1.

## Di luar lingkup v1

Kurasi produk unggulan; rating dan jumlah terjual; promo/diskon.
