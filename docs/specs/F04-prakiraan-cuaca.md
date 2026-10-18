# F04 — Prakiraan Cuaca

| | |
|---|---|
| Diimplementasikan di | LOBBY-01 FR-7 (`weather_icons`); LOBBY-02 FR-A5 (`weather`); LOBBY-03 FR-B2; LOBBY-04 FR-2 |
| Keputusan | PRD §5.1, K-A20, K-N14 |
| Terkait | F10, F12 |

## Ringkasan

Card cuaca menampilkan prakiraan harian untuk hari ini, besok, dan lusa: ikon kondisi, suhu maksimum, dan peluang hujan. Sumbernya SIGAP (Open-Meteo, 5 hari, zona WIB).

## Aturan perilaku

- R-1: Ambil item dengan `date ≥ hari ini (WIB)`, lalu 3 item pertama.
- R-2: Label dihitung ulang dari selisih tanggal WIB: "Hari ini", "Besok", "Lusa". Label dari SIGAP tidak dipakai.
- R-3: Ikon dari pemetaan persis `condition → ikon` di config. Nilai tak dikenal → ikon default (`_default`).
- R-4: Tampilkan `temperature` sebagai suhu maksimum ("Maks 30°C") dan `rainProbability` sebagai "Peluang hujan 20%".
- R-5: TV: satu hari per slide, berotasi (F10). Mobile: ketiga hari tampil bersamaan.
- R-6: Interval sinkron 15 menit.

## State & tampilan

| State modul (F12) | Tampilan |
|---|---|
| `ok` | 3 hari (atau kurang jika SIGAP mengirim kurang) |
| `stale` / `unavailable` | Satu slide "Belum ada informasi terbaru" (tidak menampilkan prakiraan lama) |
| `loading` | "Memuat…" |

## Acceptance criteria

- AC-F04-1 [LOBBY-02]: Forecast yang item pertamanya tanggal kemarin (WIB) → kemarin dibuang; label Hari ini/Besok/Lusa benar.
- AC-F04-2 [LOBBY-02]: `condition: "Salju"` → ikon default.
- AC-F04-3 [LOBBY-02]: Pukul 23.30 WIB (16.30 UTC), "Hari ini" adalah tanggal WIB, bukan tanggal UTC.
- AC-F04-4 [LOBBY-03]: Modul `stale` → "Belum ada informasi terbaru".

## Aturan / larangan

- Jangan menampilkan prakiraan yang sudah basi (K-A20).
- Jangan memanggil Open-Meteo langsung; selalu lewat SIGAP.

## Di luar lingkup v1

Prakiraan per jam; peringatan cuaca ekstrem terpisah dari status SIGAP.
