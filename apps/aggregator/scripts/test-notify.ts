import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from '../src/config/load-config';
import { createTelegramNotifier } from '../src/notify/notifier';
import type { FetchLike } from '../src/sources/http-client';

export interface TestNotifyResult {
  readonly ok: boolean;
  readonly message: string;
}

/**
 * Executes the Telegram test notification command (AC-F14-4).
 * Sends a test message to both the Technical Team and Village Admin chats.
 */
export async function runTestNotify(
  envSource: Readonly<Record<string, string | undefined>> = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<TestNotifyResult> {
  const env = parseEnv(envSource);
  if (!env.ok) {
    return { ok: false, message: `Environment tidak valid:\n${env.message}` };
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_TECH, TELEGRAM_CHAT_ADMIN } = env.value;

  if (!TELEGRAM_BOT_TOKEN) {
    return {
      ok: true,
      message:
        'TELEGRAM_BOT_TOKEN tidak disetel. Notifikasi Telegram dalam status nonaktif (F14 R-8). Tidak ada pesan yang dikirim.',
    };
  }

  if (!TELEGRAM_CHAT_TECH) {
    return {
      ok: false,
      message:
        'TELEGRAM_BOT_TOKEN terpasang namun TELEGRAM_CHAT_TECH belum disetel. Mohon tentukan ID chat tim teknis.',
    };
  }

  const notifier = createTelegramNotifier({
    token: TELEGRAM_BOT_TOKEN,
    techChatId: TELEGRAM_CHAT_TECH,
    adminChatId: TELEGRAM_CHAT_ADMIN,
    fetchImpl,
  });

  const nowStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const techMessage = `[UJI LOBBY DESA] Pesan uji coba sistem notifikasi Telegram untuk Tim Teknis (AC-F14-4).\nWaktu uji: ${nowStr} WIB\nStatus: Sistem notifikasi aktif dan siap beroperasi.`;
  const adminMessage = `[UJI LOBBY DESA] Pesan uji coba notifikasi TV Lobi untuk Admin Desa (AC-F14-4).\nWaktu uji: ${nowStr} WIB\nStatus: Pemantauan TV lobi aktif.`;

  await notifier.send('tech', techMessage);
  await notifier.send('admin', adminMessage);

  const adminTarget = TELEGRAM_CHAT_ADMIN ?? `${TELEGRAM_CHAT_TECH} (fallback)`;
  return {
    ok: true,
    message: `Pesan uji coba berhasil dikirim ke grup Tim Teknis (${TELEGRAM_CHAT_TECH}) dan Admin Desa (${adminTarget}).`,
  };
}

// CLI execution handler
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && fileURLToPath(new URL(process.argv[1], 'file://')) === currentFile) {
  const devEnvPath = fileURLToPath(new URL('../dev.env', import.meta.url));
  if (existsSync(devEnvPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(devEnvPath);
    } catch {
      // Ignore if dev.env is not loadable
    }
  }

  runTestNotify()
    .then((result) => {
      if (!result.ok) {
        process.stderr.write(`${result.message}\n`);
        process.exit(1);
      }
      process.stdout.write(`${result.message}\n`);
      process.exit(0);
    })
    .catch((err: unknown) => {
      process.stderr.write(`Gagal mengirim notifikasi: ${String(err)}\n`);
      process.exit(1);
    });
}
