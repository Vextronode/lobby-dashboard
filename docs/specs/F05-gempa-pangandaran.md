# F05 — Gempa Pangandaran

| | |
|---|---|
| Diimplementasikan di | LOBBY-02 FR-A5 (`quake_pangandaran`); LOBBY-03 FR-B2; LOBBY-04 FR-2 |
| Keputusan | PRD §5.1, K-A20, K-N15 |
| Terkait | F06, F12 |

## Ringkasan

Card yang selalu menampilkan gempa terakhir yang berpengaruh ke Pangandaran: magnitudo, lokasi, kedalaman, jarak ke desa, dan waktu. Tidak berotasi.

## Aturan perilaku

- R-1: Sumber `GET /api/public/earthquakes/pangandaran` SIGAP, passthrough. Interval sinkron 60 dtk.
- R-2: Jarak memakai `distanceToVillage` dari SIGAP ("62 km dari Cibenda"). Aggregator tidak menghitung jarak.
- R-3: Kedalaman ditampilkan sesuai string SIGAP (mis. "18 km").
- R-4: Waktu dari `updatedAt` (UTC) ditampilkan dalam WIB: "Kamis, 16 Okt 2026 · 14.05 WIB".
- R-5: Jika `updatedAt` > 24 jam lalu, tampilan diredam (kontras lebih rendah, label "Lebih dari 24 jam lalu").
- R-6: `data: null` dari SIGAP adalah respons berhasil yang berarti tidak ada gempa relevan.
- R-7: Jika field `potential` berisi teks, tampilkan satu baris di bawah data utama. Informasi tsunami tetap ditangani lewat status SIGAP (F01), bukan lewat card ini.

## State & tampilan

| Kondisi | Tampilan |
|---|---|
| `ok` dengan data | Data gempa |
| `ok`, `data: null` | "Tidak ada gempa terkini yang berdampak ke Pangandaran" |
| `stale` | Data terakhir + "per HH.MM" |
| `unavailable` | "Belum ada informasi gempa" |
| `loading` | "Memuat…" |

## Acceptance criteria

- AC-F05-1 [LOBBY-03]: Gempa 25 jam lalu → tampilan diredam.
- AC-F05-2 [LOBBY-03]: `data: null` → teks R-6, bukan error atau kosong.
- AC-F05-3 [LOBBY-03]: `updatedAt` "2026-10-16T07:05:00Z" → "14.05 WIB".

## Aturan / larangan

- Jangan menghitung ulang jarak atau mengubah magnitudo.
- Jangan menyimpulkan status tsunami dari card gempa.

## Di luar lingkup v1

Peta guncangan (shakemap); riwayat gempa Pangandaran.
