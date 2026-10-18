# F08 — Layanan Surat

| | |
|---|---|
| Diimplementasikan di | SID-02 FR-2; LOBBY-02 FR-A5 (`sid_services`); LOBBY-03 FR-B2 |
| Keputusan | PRD §5.4, K-A12, K-N9, default B16–B18 |
| Terkait | F10, F12 |

## Ringkasan

Card berotasi yang menunjukkan kinerja layanan surat desa secara agregat: KPI bulan ini, tren 12 minggu, dan jenis surat terbanyak (hanya jenis yang diizinkan desa).

## Aturan perilaku

- R-1 (bulan): bulan kalender berjalan dalam WIB.
- R-2 (diajukan): jumlah surat dengan `submitted_at` di periode tersebut.
- R-3 (selesai): jumlah surat yang **transisi terminal pertamanya** (`approved` atau `rejected`) terjadi di periode tersebut. Transisi terminal = log dengan `new_status` terminal **dan** `old_status` berbeda dari `new_status` (atau kosong). Satu surat dihitung sekali walaupun punya log `approved → approved` dari fulfillment.
- R-4 (diproses): jumlah surat yang saat ini berstatus `pending` atau `in_progress` (snapshot, tanpa filter bulan). Surat yang menunggu tanda tangan termasuk di sini.
- R-5 (tren): 12 minggu terakhir termasuk minggu berjalan; minggu = Senin 00.00 s.d. Minggu 23.59 WIB; batang = diajukan, garis = selesai; minggu tanpa data bernilai 0.
- R-6 (jenis terbanyak): hanya kode jenis surat di allowlist config SID, dihitung dari surat diajukan 90 hari terakhir, jenis dengan < 10 surat dibuang, maks 5.
- R-7: Allowlist default kosong → slide jenis terbanyak tidak ada dan card Surat hanya punya 1 slide.
- R-8: Label "selesai" mencakup disetujui maupun ditolak. Teks di layar: "Selesai diproses".

## State & tampilan

| Kondisi | Tampilan |
|---|---|
| `ok` | Slide 1: KPI (Diajukan / Selesai diproses / Sedang diproses) + tren. Slide 2 (jika ada): jenis terbanyak. |
| `stale` | Data lama + label waktu |
| `unavailable` | "Data layanan surat belum tersedia" |
| `loading` | "Memuat…" |

## Acceptance criteria

- AC-F08-1 [SID-02]: Surat `pending→in_progress→approved` lalu `approved→approved` dihitung selesai sekali, pada waktu log `in_progress→approved`.
- AC-F08-2 [SID-02]: Surat hanya dengan log `pending→pending` tidak dihitung selesai.
- AC-F08-3 [SID-02]: Disetujui 31 Okt 23.30 WIB → Oktober; 1 Nov 00.30 WIB → November.
- AC-F08-4 [SID-02]: Tren selalu 12 item, setiap `week_start` hari Senin.
- AC-F08-5 [SID-02]: Allowlist kosong → `top_types: []`; jenis dalam allowlist dengan 9 surat tidak muncul.
- AC-F08-6 [LOBBY-03]: `top_types` kosong → card Surat 1 slide.

## Aturan / larangan

- Jangan memakai `letters.processed_at` untuk "selesai".
- Jangan menampilkan data pemohon, isi surat, atau kinerja per petugas.
- Jangan mengisi allowlist tanpa keputusan desa. Usulan (belum diputuskan): A01, A04, A06, A08, A09. Jangan tampilkan A02, A03, A05, A07, A10.

## Di luar lingkup v1

Waktu proses rata-rata per jenis atau per petugas (PRD §2.3); jumlah surat dibatalkan (hard delete di SID).
