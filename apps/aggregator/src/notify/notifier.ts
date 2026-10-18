import type { FetchLike } from '../sources/http-client';

/** Who can act on the problem (K-A16): tech team for servers, village admin for the TV. */
export type Audience = 'tech' | 'admin';

/** Delivery channel; an interface so a WhatsApp adapter can be added later (K-A16). */
export interface Notifier {
  readonly enabled: boolean;
  /** Rejects when delivery fails; callers only log it (F14 R-8). */
  send(audience: Audience, text: string): Promise<void>;
}

/** Used without a Telegram token: notifications are off, nothing else changes (F14 R-8). */
export const disabledNotifier: Notifier = {
  enabled: false,
  send: () => Promise.resolve(),
};

const TELEGRAM_API = 'https://api.telegram.org';
const TELEGRAM_TIMEOUT_MS = 10_000;

export interface TelegramOptions {
  readonly token: string;
  readonly techChatId: string;
  /** Missing → admin messages go to the tech chat (F14 R-9). */
  readonly adminChatId: string | undefined;
  readonly fetchImpl: FetchLike;
}

/** Telegram Bot API `sendMessage`. Errors never include the token or URL. */
export function createTelegramNotifier(options: TelegramOptions): Notifier {
  return {
    enabled: true,
    async send(audience, text) {
      const chatId =
        audience === 'admin' ? (options.adminChatId ?? options.techChatId) : options.techChatId;
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, TELEGRAM_TIMEOUT_MS);
      try {
        const response = await options.fetchImpl(
          `${TELEGRAM_API}/bot${options.token}/sendMessage`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text }),
            signal: controller.signal,
          },
        );
        await response.body?.cancel();
        if (!response.ok) throw new Error(`telegram_status_${String(response.status)}`);
      } catch (error) {
        throw error instanceof Error && error.message.startsWith('telegram_status_')
          ? error
          : new Error(controller.signal.aborted ? 'telegram_timeout' : 'telegram_network');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
