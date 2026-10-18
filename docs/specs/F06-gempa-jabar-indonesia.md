# F06 — Gempa Jawa Barat & Indonesia

| | |
|---|---|
| Diimplementasikan di | SIGAP-01 §B; LOBBY-02 FR-A5 (`quake_list`); LOBBY-03 FR-B2 |
| Keputusan | PRD §5.1, K-N2 (dikonfirmasi), K-A20 |
| Terkait | F05, F10, F12 |

## Ringkasan

Satu daftar gabungan gempa cakupan Jawa Barat dan Indonesia, masing-masing diberi tag, ditampilkan 3 baris per halaman dan berganti halaman setiap ketukan.

## Aturan perilaku

- R-1 (sumber utama): SIGAP `earthquakes/recent?scope=west-java` dan `?scope=indonesia` (endpoint baru SIGAP-01).
- R-2 (cadangan): jika endpoint `recent` belum ada (404) atau config `mode = latest-pair`, pakai `earthquakes/west-java` + `earthquakes/indonesia` (masing-masing maksimal 1 kejadian) → maksimal 2 baris tanpa paging.
- R-3 (tag): item dari cakupan Jabar diberi tag "Jabar"; sisanya "Indonesia".
- R-4 (dedupe): kejadian yang sama di kedua cakupan (kunci: `updatedAt` + `magnitude` + koordinat dibulatkan 2 desimal) tampil sekali dengan tag "Jabar".
- R-5: Urut dari yang terbaru, maksimal 9 item (config `limit`).
- R-6 (paging): 3 baris per halaman, `ceil(item / 3)` halaman, berganti tiap ketukan (F10). Bukan scroll kontinu.
- R-7: Setiap baris: tag, magnitudo, lokasi, kedalaman, jarak (`distanceToVillage`), waktu WIB.

## State & tampilan

| Kondisi | Tampilan |
|---|---|
| `ok` dengan item | Halaman 3 baris |
| `ok`, 0 item | "Belum ada data gempa" |
| `stale` | Daftar terakhir + "per HH.MM" (setiap baris sudah memuat waktu kejadian) |
| `unavailable` | "Belum ada informasi gempa" |
| `loading` | "Memuat…" |

## Non-functional requirements

- NFR-1: SIGAP tidak menulis ke database saat melayani endpoint `recent`.
- NFR-2: Endpoint `recent` memakai cache gempa SIGAP yang sudah ada (30 dtk).

## Acceptance criteria

- AC-F06-1 [SIGAP-01, LOBBY-02]: Kejadian yang sama di dua cakupan tampil sekali dengan tag Jabar.
- AC-F06-2 [LOBBY-02]: Skenario `quake-latest-pair` → maksimal 2 item, 1 halaman.
- AC-F06-3 [LOBBY-03]: 7 item → 3 halaman (3, 3, 1) yang berganti tiap ketukan.
- AC-F06-4 [SIGAP-01]: `scope` tidak valid → 400; tidak ada kejadian → `data: []`.

## Aturan / larangan

- Jangan membangun riwayat gempa sendiri di aggregator (menyimpan kejadian dari waktu ke waktu); daftar selalu berasal dari SIGAP.

## Di luar lingkup v1

Filter berdasarkan magnitudo; peta lokasi gempa.
