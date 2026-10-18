# F13 — Recovery Kiosk

| | |
|---|---|
| Diimplementasikan di | LOBBY-02 FR-E8 (`build`, `server_time`); LOBBY-03 §E; LOBBY-05 §C, §D |
| Keputusan | PRD §8.3, K-A15, default B25 |
| Terkait | F12, F14 |

## Ringkasan

TV lobby harus berjalan berbulan-bulan tanpa operator. Apa pun gangguannya (listrik, WiFi, error aplikasi, deploy baru), layar pulih sendiri dan tidak pernah menampilkan halaman error browser.

## Aturan perilaku

- R-1: Shell aplikasi dan respons data terakhir di-cache di perangkat. Saat jaringan atau aggregator mati, reload tetap menampilkan data terakhir dengan label basi.
- R-2: Error di aplikasi → layar netral "Layar sedang dipulihkan", lalu reload otomatis setelah 10 dtk.
- R-3: Maksimal 3 reload otomatis karena error dalam 1 jam. Setelah itu reload berhenti, layar netral tetap tampil, dan poll terus dicoba. Begitu poll berhasil, layar kembali normal.
- R-4: Reload terjadwal setiap hari pukul 03.00 WIB.
- R-5: Saat versi build di server berubah, TV reload sekali pada batas ketukan berikutnya.
- R-6: Layar tidak tidur (wake lock jika didukung), kursor disembunyikan, tanpa scrollbar, tanpa seleksi teks atau menu konteks, tanpa dialog `alert/confirm/prompt`.
- R-7: Perangkat membuka URL `/tv?device=<id>` otomatis saat menyala (diatur di LOBBY-05 §C).
- R-8: Setiap poll status membawa `device`, sehingga aggregator tahu kapan TV terakhir terlihat (dipakai F14).

## Non-functional requirements

- NFR-1: Berjalan 72 jam tanpa intervensi, dengan memori stabil.
- NFR-2: Setelah listrik padam lalu menyala, halaman tampil sendiri dalam ≤ 2 menit.

## Acceptance criteria

- AC-F13-1 [LOBBY-03]: Aggregator mati lalu halaman di-reload → data terakhir tampil dengan label basi; tidak ada halaman error browser.
- AC-F13-2 [LOBBY-03]: Error disengaja → layar netral → reload; setelah 3 kali dalam 1 jam reload berhenti.
- AC-F13-3 [LOBBY-03]: Perubahan `build` → reload sekali pada batas ketukan.
- AC-F13-4 [LOBBY-05]: Uji manual di lokasi: cabut listrik, matikan WiFi 10 menit, restart container, soak 72 jam.

## Aturan / larangan

- Jangan menampilkan pesan error teknis, kode HTTP, atau stack trace di layar.
- Jangan bergantung pada browser bawaan Smart TV non-Android untuk produksi (tidak bisa membuka URL otomatis saat menyala).

## Di luar lingkup v1

Remote control perangkat dari server; screenshot otomatis dari TV.
