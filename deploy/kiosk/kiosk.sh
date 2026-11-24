#!/usr/bin/env bash
# ==============================================================================
# Skrip Autostart Kiosk TV Lobi Desa Cibenda (LOBBY-05)
# Perangkat: Mini PC / Raspberry Pi OS / Linux Desktop Kiosk
# ==============================================================================

set -u

# URL tujuan tampilan TV lobi (dapat di-override via env TV_URL)
TV_URL="${TV_URL:-http://localhost:8080/tv?device=tv-lobby-1}"

# Pastikan DISPLAY disetel
export DISPLAY="${DISPLAY:-:0}"

# 1. Matikan mode hemat daya, screen blanking, dan screensaver
if command -v xset >/dev/null 2>&1; then
  xset s off
  xset -dpms
  xset s noblank
fi

# 2. Sembunyikan kursor mouse saat tidak digerakkan (0.5 detik)
if command -v unclutter >/dev/null 2>&1; then
  unclutter -idle 0.5 -root &
fi

# 3. Cari biner peramban yang tersedia (Chromium / Google Chrome / Brave)
BROWSER_BIN=""
for candidate in chromium-browser chromium google-chrome-stable google-chrome brave-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    BROWSER_BIN="$candidate"
    break
  fi
done

if [ -z "$BROWSER_BIN" ]; then
  echo "Error: Peramban Chromium/Chrome tidak ditemukan. Silakan pasang chromium-browser terlebih dahulu." >&2
  exit 1
fi

echo "Memulai Kiosk TV Lobi menggunakan $BROWSER_BIN..."
echo "URL Target: $TV_URL"

# 4. Loop peluncuran peramban dalam mode kiosk (pemulihan otomatis jika crash)
while true; do
  "$BROWSER_BIN" \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-component-update \
    --check-for-update-interval=315360000 \
    --disable-features=TranslateUI \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --autoplay-policy=no-user-gesture-required \
    --window-position=0,0 \
    --window-size=1280,720 \
    "$TV_URL"

  EXIT_CODE=$?
  echo "Peramban kiosk berhenti dengan exit code $EXIT_CODE. Memulai ulang dalam 2 detik..."
  sleep 2
done
