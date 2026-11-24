# Panduan Deployment & Operasional Kiosk TV Lobi (LOBBY-05)

Dokumen ini merupakan panduan teknis operasional bagi tim lapangan dan teknisi kantor desa dalam menginstalasi, mengonfigurasi, dan merawat infrastruktur Dashboard Lobi Desa Cibenda.

---

## 1. Topologi Sistem di Kantor Desa

Sistem Dashboard Lobi terdiri dari dua komponen utama:
1. **Host Aggregator & Web Server**: Berjalan di Mini PC atau server lokal kantor desa (menjalankan kontainer Docker `lobby-dashboard` pada port 8080).
2. **Kiosk TV Display**: Layar TV lobi (resolusi minimum 1280×720 piksel) yang terhubung ke Mini PC melalui HDMI atau terpasang pada Smart TV/Android TV yang mengakses rute `/tv?device=tv-lobby-1`.
3. **Portal Mobile Warga**: Dapat diakses warga di area lobi melalui pemindaian QR Code di layar TV yang mengarah ke rute `/`.

---

## 2. Instalasi Server Menggunakan Docker

### 2.1 Persyaratan Sistem
- Sistem Operasi: Linux (Ubuntu 22.04 LTS / Debian 12 / Raspberry Pi OS 64-bit disarankan).
- Perangkat Lunak: Docker Engine versi 24+ dan Docker Compose v2+.
- Jaringan: Terhubung ke LAN/WiFi kantor desa dengan IP statis atau reservasi DHCP.

### 2.2 Langkah Deployment

1. Unduh atau clone repositori ke direktori `/opt/lobby`:
   ```bash
   sudo git clone https://github.com/Vextronode/lobby-dashboard.git /opt/lobby
   cd /opt/lobby
   ```

2. Buat berkas environment produksi:
   ```bash
   cp deploy/.env.example deploy/.env
   nano deploy/.env
   ```
   Isi konfigurasi berikut sesuai URL layanan desa:
   ```env
   SIGAP_BASE_URL=https://sigap.cibenda.desa.id/api
   SID_BASE_URL=https://sid.cibenda.desa.id/api
   CIMART_BASE_URL=https://cimart.cibenda.desa.id/api

   # Konfigurasi Notifikasi Telegram (opsional)
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
   TELEGRAM_CHAT_TECH=-1001234567890
   TELEGRAM_CHAT_ADMIN=-1009876543210

   PORT=8080
   TRUST_PROXY=false
   BUILD_ID=v1.0.0
   ```

3. Jalankan kontainer dengan Docker Compose:
   ```bash
   cd /opt/lobby/deploy
   docker compose up -d
   ```

4. Verifikasi status kontainer dan log:
   ```bash
   docker compose ps
   curl -s http://localhost:8080/healthz
   # Respon yang diharapkan: {"ok":true}
   ```

---

## 3. Konfigurasi Kiosk TV Fisik (Auto-Start on Boot)

### 3.1 Pilihan A: Mini PC / Raspberry Pi OS (Linux X11)

1. Pasang dependensi peramban dan penunjang kiosk:
   ```bash
   sudo apt-get update
   sudo apt-get install -y chromium-browser unclutter xdotool
   ```

2. Pasang systemd service agar peramban otomatis menyala saat sistem boot:
   ```bash
   sudo cp /opt/lobby/deploy/kiosk/lobby-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable lobby-kiosk.service
   sudo systemctl start lobby-kiosk.service
   ```

3. Atau gunakan XDG autostart desktop entry:
   ```bash
   mkdir -p ~/.config/autostart
   cp /opt/lobby/deploy/kiosk/autostart.desktop ~/.config/autostart/
   ```

4. Pengaturan Layar TV & Hemat Daya (OS):
   - Buka menu display settings OS, tetapkan resolusi layar ke 1280×720 (atau 1920×1080).
   - Nonaktifkan Screen Saver, Blank Screen, dan Suspend / Sleep pada menu Power Management.
   - Pada remote TV fisik, nonaktifkan fitur Auto Standby / Sleep Timer.

### 3.2 Pilihan B: Android TV

Jika menggunakan Android TV atau Smart TV Box:
1. Pasang aplikasi **Fully Kiosk Browser** dari Google Play Store.
2. Pada pengaturan Fully Kiosk Browser:
   - **Start URL**: `http://<IP-SERVER-DESA>:8080/tv?device=tv-lobby-1`
   - **Kiosk Mode**: Aktifkan (PIN proteksi).
   - **Keep Screen On**: Aktif.
   - **Run on Boot**: Aktif.
   - **Disable Pull to Refresh & Overscroll**: Aktif.

---

## 4. Pengujian & Simulasi Lapangan

Sebelum serah terima ke perangkat desa, lakukan rangkaian simulasi berikut:

### 4.1 Uji Pemulihan Mati Listrik (Failover NFR-2)
1. Cabut kabel daya Mini PC dan TV lobi saat sistem sedang aktif.
2. Pasang kembali kabel daya stopkontak.
3. Catat waktu yang dibutuhkan hingga layar TV menampilkan kembali dasbor.
4. **Target**: Dasbor harus muncul otomatis dalam waktu kurang dari 2 menit tanpa intervensi mouse atau keyboard.

### 4.2 Uji Pemutusan Jaringan WiFi (Ketahanan Offline AC-F13-1)
1. Putuskan sambungan kabel LAN atau matikan access point WiFi kantor desa selama 10 menit.
2. Amati tampilan TV:
   - Peramban tidak boleh menampilkan layar putih error koneksi browser (ERR_CONNECTION_REFUSED atau Dinosaurs game).
   - TV harus tetap memutar kartu-kartu informasi menggunakan data terakhir dari cache lokal (localStorage/IndexedDB), dengan penanda status waktu pembaruan terakhir yang jelas.
3. Sambungkan kembali WiFi: sistem harus menyinkronkan data terbaru secara otomatis pada ketukan beat 15 detik berikutnya.

### 4.3 Uji Kebocoran Memori (Soak Test)
Untuk memastikan aggregator dan antarmuka stabil berjalan berhari-hari tanpa restart:
```bash
# Uji soak terakselerasi di lingkungan server (simulasi 120 menit)
pnpm soak 120
```
Amati keluaran penggunaan memori (heap). Nilai heap harus stabil (plateau) dan tidak terus merangkak naik secara linier.

---

## 5. Verifikasi Notifikasi Gangguan Telegram (F14)

1. Jalankan perintah uji coba notifikasi:
   ```bash
   pnpm notify:test
   ```
2. Pastikan pesan uji coba masuk ke:
   - Grup Telegram Tim Teknis (pesan status kesiapan sistem).
   - Grup Telegram Admin Desa (pesan kesiapan pemantauan TV lobi).

3. Simulasi Gangguan TV di Jam Kerja (Senin–Jumat 07.00–16.00 WIB):
   - Tutup peramban TV atau matikan TV selama lebih dari 5 menit.
   - Bot Telegram akan otomatis mengirim pesan pemberitahuan ke Admin Desa:
     > *"Layar TV lobby tidak tersambung sejak [Waktu]. Coba cabut-colok perangkat TV/kiosk dan cek WiFi."*
   - Hidupkan kembali TV: bot akan mengirimkan pesan konfirmasi pemulihan setelah TV berhasil terhubung kembali.

---

## 6. Daftar Periksa Serah Terima Lapangan (Checklist)

| No | Parameter Pemeriksaan | Target Standar | Status Verifikasi |
|---|---|---|---|
| 1 | URL Kiosk TV | `http://<host>:8080/tv?device=tv-lobby-1` | Selesai |
| 2 | Auto-start on boot | Layar TV otomatis tampil setelah listrik nyala $\le 2$ menit | Selesai |
| 3 | Tampilan Kiosk | Tanpa kursor mouse, tanpa dialog error peramban, tanpa scrollbar | Selesai |
| 4 | Ketahanan Offline | Data cache lokal tetap berputar saat koneksi terputus | Selesai |
| 5 | Rotasi Beat | Kartu berotasi serempak setiap 15 detik (detik :00, :15, :30, :45) | Selesai |
| 6 | QR Code Mobile | QR Code di pojok kanan bawah dapat dipindai ponsel ke rute `/` | Selesai |
| 7 | Portal Mobile | Halaman mobile responsif 320 px, tanpa horizontal scroll | Selesai |
| 8 | Bot Telegram | Notifikasi `notify:test` terkirim ke tim teknis & admin desa | Selesai |
