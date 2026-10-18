# F07 — Penduduk & Profil Warga

| | |
|---|---|
| Diimplementasikan di | SID-01; LOBBY-02 FR-A5 (`sid_population`); LOBBY-03 FR-B2 |
| Keputusan | PRD §5.4, K-A9, K-A10, K-A11, K-A12, K-N4 s.d. K-N8 |
| Terkait | F10, F12 |

## Ringkasan

Dua card di kolom kanan TV. **Penduduk** (statis): total jiwa, jumlah KK, dan rasio laki-laki/perempuan. **Profil Warga** (berotasi): piramida usia × gender, top 5 mata pencaharian, dan sebaran per dusun. Semua agregasi dan penyamaran terjadi di SID; data individu tidak pernah keluar dari SID.

## Aturan perilaku

### Publikasi
- R-1: Data hanya dikirim jika flag SID `LOBBY_POPULATION_PUBLISHED = true` (default `false`). Selama `false`, SID tidak mengirim angka apa pun dan tidak menjalankan query penduduk.
- R-2: Flag dinyalakan atas permintaan desa setelah input data warga dinyatakan lengkap.

### Populasi dasar
- R-3: Warga yang dihitung = `citizens` desa dengan `is_active = true`, semua `domicile_status`. **Semua** angka di F07 memakai populasi dasar yang sama, sehingga L + P = total.
- R-4: Jumlah KK = `families` desa dengan `family_status = 'aktif'`.

### Penyamaran kelompok kecil
- R-5: Ambang penyamaran = 10. Sel atau kelompok < 10 dikirim `null` dan ditampilkan "<10". Total desa dan jumlah L/P tidak disamarkan.

### Piramida usia
- R-6: Usia dihitung terhadap tanggal hari ini (WIB) dari `date_of_birth`. Kelompok 10 tahunan: 0–9, 10–19, …, 60–69, 70+.

### Mata pencaharian
- R-7: Top 5 pekerjaan terbanyak dari daftar `occupations` desa, **tidak termasuk** kategori non-kerja (default: "Tidak bekerja", "Pelajar/Mahasiswa", "Ibu rumah tangga"; dicocokkan tanpa membedakan huruf besar/kecil) dan tidak termasuk yang belum diisi. Setiap pekerjaan di top 5 harus ≥ 10 orang.
- R-8: Di bawah top 5 tampil satu baris catatan: "+ N lainnya · N belum bekerja/pelajar/IRT · N belum diisi". "Lainnya" mencakup pekerjaan di luar top 5 dan kelompok < 10.
- R-9: Total semua bucket (top + lainnya + non-kerja + belum diisi) = total penduduk.

### Dusun
- R-10: Semua dusun aktif desa, diurutkan menurut nama, dengan jumlah warga. Jumlah < 10 → "<10". Warga tanpa dusun → baris "Belum diisi".
- R-11: Nama dusun selalu dari data SID; tidak ada nama dusun yang di-hardcode.

### Tanggal data
- R-12: Card Penduduk menampilkan "Data per <tanggal WIB>" dari `as_of` (perubahan data warga/KK terakhir), bukan waktu query.

## State & tampilan

| Kondisi | Card Penduduk | Card Profil Warga |
|---|---|---|
| `published: false` | "Data kependudukan sedang dimutakhirkan" | 1 slide placeholder yang sama, tidak berotasi |
| `ok` | Angka + "Data per …" | 3 slide: piramida, pekerjaan, dusun |
| `stale` | Angka lama + label waktu | Data lama + label waktu |
| `unavailable` | "Data kependudukan belum tersedia" | Placeholder yang sama |
| `loading` | "Memuat…" | "Memuat…" |

## Non-functional requirements

- NFR-1: Interval sinkron 60 menit; SID meng-cache respons 10 menit.
- NFR-2: Perhitungan di SID < 2 dtk untuk ±10.000 warga.

## Acceptance criteria

- AC-F07-1 [SID-01]: Flag `false` → respons hanya `{published:false, generated_at}`.
- AC-F07-2 [SID-01]: 30 warga aktif + 3 tidak aktif → total 30, L + P = 30.
- AC-F07-3 [SID-01]: Sel piramida berisi 4 → `null`; berisi 10 → 10.
- AC-F07-4 [SID-01]: "Tidak bekerja" tidak pernah masuk top 5 walaupun terbanyak; total semua bucket = total.
- AC-F07-5 [SID-01]: Dusun dengan 3 warga → `null`; dusun nonaktif tidak muncul.
- AC-F07-6 [SID-01]: Warga yang berulang tahun ke-10 hari ini (WIB) masuk 10–19.
- AC-F07-7 [LOBBY-03]: `published: false` → kedua card menampilkan placeholder; Profil Warga tidak berotasi.
- AC-F07-8 [LOBBY-03]: Nilai `null` tampil sebagai "<10".

## Aturan / larangan

- Jangan pernah menyentuh `family_socioeconomics` (data penghasilan).
- Jangan mengirim atau menampilkan data individu, termasuk daftar umur atau tanggal lahir.
- Jangan menampilkan data penduduk di halaman mobile.

## Di luar lingkup v1

Mutasi penduduk (lahir/meninggal/pindah); data per RT/RW; toggle publikasi di panel admin SID.
