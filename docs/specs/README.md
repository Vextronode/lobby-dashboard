# Spesifikasi Fitur — Lobby Dashboard

Satu file per fitur. **Spec adalah sumber kebenaran untuk perilaku**: apa yang dilihat warga, aturan data, dan kebijakan. **Tiket** (`../tickets/`) adalah unit kerja per repo: di mana dan bagaimana fitur dibangun, termasuk kontrak endpoint, file, dan test teknis.

Aturan pembagian supaya tidak ada dua sumber yang saling bertentangan:

| Ditulis di spec | Ditulis di tiket |
|---|---|
| Aturan perilaku (R-…), state, teks untuk warga, ambang & default | Lokasi kode, route, kontrak JSON, config key, migrasi/limiter |
| Acceptance criteria perilaku (AC-Fxx-n), masing-masing diberi label tiket yang wajib membuktikannya | Acceptance criteria teknis (privasi query, jumlah query, rate limit, build) |
| Rujukan keputusan `K-…` | Rujukan ke spec `Fxx R-n` |

Jika spec dan tiket berbeda, **spec yang benar**, dan tiketnya harus diperbaiki.

## Daftar spec

| ID | Fitur | Tiket yang mengimplementasikan |
|---|---|---|
| [F01](F01-status-kesiapsiagaan.md) | Status kesiapsiagaan | SIGAP-01, LOBBY-02, LOBBY-03, LOBBY-04 |
| [F02](F02-layar-awas.md) | Layar Awas & pencabutan | LOBBY-02, LOBBY-03, LOBBY-04 |
| [F03](F03-running-text.md) | Running text | SID-02, LOBBY-02, LOBBY-03, LOBBY-04 |
| [F04](F04-prakiraan-cuaca.md) | Prakiraan cuaca | LOBBY-02, LOBBY-03, LOBBY-04 |
| [F05](F05-gempa-pangandaran.md) | Gempa Pangandaran | LOBBY-02, LOBBY-03, LOBBY-04 |
| [F06](F06-gempa-jabar-indonesia.md) | Gempa Jabar/Indonesia | SIGAP-01, LOBBY-02, LOBBY-03 |
| [F07](F07-penduduk-dan-profil-warga.md) | Penduduk & profil warga | SID-01, LOBBY-02, LOBBY-03 |
| [F08](F08-layanan-surat.md) | Layanan surat | SID-02, LOBBY-02, LOBBY-03 |
| [F09](F09-etalase-cimart.md) | Etalase CiMart | CIMART-01, LOBBY-02, LOBBY-03, LOBBY-04 |
| [F10](F10-rotasi-serempak.md) | Rotasi serempak 15 detik | LOBBY-03 |
| [F11](F11-halaman-mobile-dan-qr.md) | Halaman mobile, QR & Aplikasi Desa | LOBBY-01, LOBBY-03, LOBBY-04 |
| [F12](F12-kesegaran-data.md) | Kesegaran data & state modul | LOBBY-02, LOBBY-03, LOBBY-04 |
| [F13](F13-recovery-kiosk.md) | Recovery kiosk | LOBBY-02, LOBBY-03, LOBBY-05 |
| [F14](F14-notifikasi.md) | Notifikasi | LOBBY-02, LOBBY-05 |

## Format setiap spec

1. **Ringkasan**: tujuan fitur bagi warga/desa.
2. **Aturan perilaku** (`R-n`): satu aturan per baris, bisa diuji.
3. **State & tampilan**: tabel kondisi → apa yang tampil.
4. **Non-functional requirements**.
5. **Acceptance criteria** (`AC-Fxx-n [TIKET]`).
6. **Aturan / larangan**.
7. **Di luar lingkup v1**.

Istilah bersama dipakai di semua spec: **ketukan** (beat, 15 dtk), **modul** (satu sumber data di aggregator), **basi** (stale), **level tampil** (level setelah kebijakan F01), **WIB** (`Asia/Jakarta`).
