# F14 — Notifikasi

| | |
|---|---|
| Diimplementasikan di | LOBBY-02 §F; LOBBY-05 §B |
| Keputusan | PRD §8.5, K-A16 |
| Terkait | F12, F13 |

## Ringkasan

Masalah yang membuat layar tidak berguna tidak boleh terjadi diam-diam. Notifikasi dikirim lewat Telegram ke orang yang **bisa bertindak**: tim teknis untuk masalah server, admin desa untuk masalah TV di lobby.

## Aturan perilaku

- R-1 (sumber data → tim teknis): saat sebuah modul gagal 5 kali beruntun, kirim satu pesan. Contoh: "SID tidak bisa dihubungi sejak 09.05 (5× gagal). Card penduduk menampilkan data per 08.55."
- R-2: Selama masih gagal, kirim pengingat setiap 6 jam. Saat pulih, kirim satu pesan pulih.
- R-3 (TV → admin desa): jika TV tidak terlihat (tidak ada poll) > 5 menit **di dalam jam operasional**, kirim satu pesan dengan langkah sederhana. Contoh: "Layar TV lobby tidak tersambung sejak 09.12. Coba cabut-colok perangkat TV/kiosk dan cek WiFi."
- R-4: Di luar jam operasional (default Senin–Jumat 07.00–16.00 WIB), tidak ada notifikasi TV.
- R-5: Pesan pulih dikirim ke grup yang sama dengan pesan awalnya.
- R-6: Pesan untuk admin desa memakai bahasa sehari-hari, tanpa istilah teknis.
- R-7: Hanya perangkat yang terdaftar di config yang dipantau.
- R-8: Tanpa token Telegram, notifikasi nonaktif tanpa mengganggu fungsi lain. Gagal kirim hanya dicatat di log.
- R-9: Jika admin desa tidak memakai Telegram, pesan admin diarahkan ke grup tim teknis.

## Acceptance criteria

- AC-F14-1 [LOBBY-02]: 5 kegagalan beruntun → tepat 1 pesan tim teknis; 10 kegagalan → tetap 1; pulih → 1 pesan pulih.
- AC-F14-2 [LOBBY-02]: TV diam 6 menit pukul 10.00 Senin → 1 pesan admin; pukul 20.00 → 0 pesan.
- AC-F14-3 [LOBBY-02]: Telegram tidak bisa dihubungi → scheduler dan API tetap berjalan.
- AC-F14-4 [LOBBY-05]: `pnpm notify:test` mengirim pesan uji ke kedua grup; uji lokasi mematikan TV > 5 menit di jam kerja menghasilkan pesan admin dan pesan pulih.

## Aturan / larangan

- Jangan mengirim detail teknis (URL, stack trace, kode error) ke admin desa.
- Jangan memakai gateway WhatsApp tidak resmi.

## Di luar lingkup v1

Adapter WhatsApp resmi; eskalasi bertingkat; dasbor status publik.
