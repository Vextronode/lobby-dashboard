# F12 — Kesegaran Data & State Modul

| | |
|---|---|
| Diimplementasikan di | LOBBY-01 FR-7 (interval); LOBBY-02 §A, §C; LOBBY-03 §A; LOBBY-04 FR-5 |
| Keputusan | PRD §8.2, K-A20, default B1–B6 |
| Terkait | Semua spec yang menampilkan data |

## Ringkasan

Setiap sumber data adalah "modul" dengan jadwal sinkron sendiri. Layar selalu jujur soal umur data: data lama diberi label, data yang terlalu lama tidak ditampilkan, dan kegagalan satu sumber tidak mengganggu yang lain.

## Aturan perilaku

- R-1: Umur data = waktu sejak sinkron **berhasil** terakhir (`fetched_at`), bukan waktu yang ada di dalam data.
- R-2: State dihitung saat data dibaca, bukan disimpan saat sinkron:
  - `loading`: belum pernah dicoba dan belum ada data;
  - `ok`: umur ≤ 3 × interval;
  - `stale`: umur > 3 × interval dan ≤ umur maksimum;
  - `unavailable`: sudah dicoba tanpa pernah berhasil, atau umur > umur maksimum (data tidak dikirim).
- R-3: Interval dan umur maksimum per modul:

| Modul | Interval | Basi setelah | Umur maksimum |
|---|---|---|---|
| Status | 60 dtk | 3 mnt | 24 jam |
| Gempa Pangandaran | 60 dtk | 3 mnt | 24 jam |
| Gempa Jabar/Indonesia | 60 dtk | 3 mnt | 24 jam |
| Cuaca | 15 mnt | 45 mnt | 24 jam |
| Titik kumpul & kontak | 60 mnt | 3 jam | 7 hari |
| Penduduk | 60 mnt | 3 jam | 7 hari |
| Layanan surat & pengumuman | 15 mnt | 45 mnt | 24 jam |
| CiMart | 15 mnt | 45 mnt | 24 jam |

- R-4: Tampilan saat `stale` mengikuti K-A20: cuaca → "Belum ada informasi terbaru"; gempa → data + "per HH.MM"; SID dan CiMart → data lama + label waktu; status → aturan F01.
- R-5: `unavailable` → placeholder netral per card, tidak pernah pesan error teknis.
- R-6: Setelah 3 kegagalan beruntun, jeda percobaan berlipat (× 2, × 4, …) dengan batas 15 menit; untuk status batasnya 2 menit. Satu keberhasilan mengembalikan jeda normal.
- R-7: Kegagalan satu modul tidak memengaruhi modul lain.
- R-8: Data yang sudah ada tidak pernah dikosongkan karena satu permintaan gagal, baik di aggregator maupun di klien.
- R-9: Setelah aggregator restart, data terakhir langsung tersedia dengan `fetched_at` aslinya.
- R-10: Semua perhitungan umur memakai jam server (`server_time`), bukan jam perangkat.

## Acceptance criteria

- AC-F12-1 [LOBBY-02]: Status berhasil pada T, scheduler dihentikan, jam dimajukan 181 dtk → `stale` tanpa ada penulisan baru.
- AC-F12-2 [LOBBY-02]: Skenario `sid-down` → modul SID `stale` lalu `unavailable` sesuai umur; modul lain tetap `ok`.
- AC-F12-3 [LOBBY-02]: Snapshot rusak → aggregator tetap start, semua modul `loading`.
- AC-F12-4 [LOBBY-03, LOBBY-04]: Skenario semua modul `unavailable` → setiap card menampilkan placeholder netral tanpa kode error.

## Aturan / larangan

- Jangan menampilkan data basi seolah segar (selalu ada label waktu).
- Jangan menyimpan state `ok/stale` sebagai nilai tetap.

## Di luar lingkup v1

Mengubah interval lewat antarmuka admin.
