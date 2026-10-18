# Lobby Dashboard Desa Cibenda

Kiosk website untuk TV lobby Kantor Desa Cibenda (1280×720, read-only) + halaman mobile via QR. Membaca data dari SIGAP, SID, dan CiMart lewat aggregator milik repo ini. Semua teks untuk warga dalam Bahasa Indonesia.

## Dokumen acuan (baca sebelum menulis kode)

| Dokumen | Isi | Status |
|---|---|---|
| `docs/specs/` | Spec per fitur F01–F14: aturan perilaku `R-n`, state, AC `AC-Fxx-n` (salinan tercommit dari `docs/task/specs/`) | **Sumber kebenaran perilaku** |
| `docs/task/tickets/` | Tiket per repo: lokasi kode, kontrak, test teknis, bagian Laporan | Unit kerja |
| `docs/task/tickets/README.md` | Daftar tiket, dependensi, urutan gelombang, templat Laporan | Indeks |
| `docs/CODE_GUIDELINES.md` | Code guidelines + checklist review (§14) (salinan tercommit dari `docs/task/04-code-guidelines.md`) | Wajib diikuti |
| `docs/task/03-struktur-folder.md` | Struktur monorepo dan arah dependensi | Wajib diikuti |
| `docs/task/02-keputusan-final.md` | Keputusan produk `K-A*`, `K-N*` | Rujukan |
| `docs/task/audit/` | Hasil audit read-only sistem inti (bentuk endpoint asli) | Rujukan kontrak upstream |

Prioritas jika ada konflik: keamanan & privasi (guidelines §2) → spec → tiket → guidelines lainnya. Jika dokumen bertentangan dengan kode yang ada, **berhenti dan laporkan**, jangan menebak.

## Aturan keras

- Tidak ada endpoint tulis (POST/PUT/PATCH/DELETE) di lapisan mana pun.
- Tidak ada PII (NIK, KK, nama warga, alamat, tanggal lahir, penghasilan, kontak penjual) di respons, log, atau fixture.
- Jangan pernah menampilkan "Aman"/GREEN saat data tidak tersedia atau tidak dikenal (F01).
- Klien tidak pernah memanggil SIGAP/SID/CiMart langsung; hanya lewat aggregator.
- Logic aturan ada di `packages/core` sebagai fungsi murni; `now` selalu parameter.
- Tampilan visual **ditahan**: styling minimum dan netral sampai ada tiket desain.
- Kerjakan hanya ruang lingkup tiket aktif. Temuan lain ditulis di Laporan.

## Perintah

```bash
pnpm dev        # mock upstream + aggregator + web
pnpm check      # lint + typecheck + test
pnpm build
pnpm e2e        # Playwright (screenshot per skenario)
```

(Perintah ini dibuat di LOBBY-01. Sebelum LOBBY-01 selesai, repo masih kosong.)

## Alur kerja dengan slash command

- `/next-ticket`: tiket mana yang siap dikerjakan sekarang.
- `/ticket <ID>`: kerjakan satu tiket dari awal sampai Laporan terisi.
- `/verify-ticket <ID>`: cek ulang semua AC tiket + AC spec dengan bukti.
- `/review-ticket <ID>`: review perubahan terhadap guidelines §14 sebelum PR.

Konvensi git: branch `feat/<ticket-id-lowercase>-<ringkas>`, commit Conventional Commits dengan ID tiket, mis. `feat(aggregator): add status policy [LOBBY-02]`.
