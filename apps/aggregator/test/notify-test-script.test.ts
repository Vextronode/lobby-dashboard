import { describe, expect, it, vi } from 'vitest';
import type { FetchLike } from '../src/sources/http-client';
import { runTestNotify } from '../scripts/test-notify';

const BASE_VALID_ENV = {
  SIGAP_BASE_URL: 'http://localhost:8090/sigap',
  SID_BASE_URL: 'http://localhost:8090/sid',
  CIMART_BASE_URL: 'http://localhost:8090/cimart',
};

describe('runTestNotify (AC-F14-4)', () => {
  it('returns ok when TELEGRAM_BOT_TOKEN is not configured (disabled state per F14 R-8)', async () => {
    const result = await runTestNotify({
      ...BASE_VALID_ENV,
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain('TELEGRAM_BOT_TOKEN tidak disetel');
    expect(result.message).toContain('nonaktif');
  });

  it('fails if TELEGRAM_BOT_TOKEN is provided but TELEGRAM_CHAT_TECH is missing', async () => {
    const result = await runTestNotify({
      ...BASE_VALID_ENV,
      TELEGRAM_BOT_TOKEN: '123456:ABC-DEF',
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('TELEGRAM_CHAT_TECH belum disetel');
  });

  it('sends test messages to both tech and admin chats when configured', async () => {
    const calls: { url: string; body: string }[] = [];
    const mockFetch = vi.fn<FetchLike>((url, init) => {
      const body = typeof init?.body === 'string' ? init.body : '';
      calls.push({ url, body });
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    const result = await runTestNotify(
      {
        ...BASE_VALID_ENV,
        TELEGRAM_BOT_TOKEN: '123456:ABC-DEF',
        TELEGRAM_CHAT_TECH: '-100111222333',
        TELEGRAM_CHAT_ADMIN: '-100444555666',
      },
      mockFetch,
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain('berhasil dikirim');
    expect(calls).toHaveLength(2);

    expect(calls[0]?.url).toBe('https://api.telegram.org/bot123456:ABC-DEF/sendMessage');
    expect(calls[0]?.body).toContain('-100111222333');
    expect(calls[0]?.body).toContain('Tim Teknis');

    expect(calls[1]?.url).toBe('https://api.telegram.org/bot123456:ABC-DEF/sendMessage');
    expect(calls[1]?.body).toContain('-100444555666');
    expect(calls[1]?.body).toContain('Admin Desa');
  });

  it('falls back admin chat to tech chat when TELEGRAM_CHAT_ADMIN is not set (F14 R-9)', async () => {
    const calls: { url: string; body: string }[] = [];
    const mockFetch = vi.fn<FetchLike>((url, init) => {
      const body = typeof init?.body === 'string' ? init.body : '';
      calls.push({ url, body });
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    const result = await runTestNotify(
      {
        ...BASE_VALID_ENV,
        TELEGRAM_BOT_TOKEN: '123456:ABC-DEF',
        TELEGRAM_CHAT_TECH: '-100111222333',
      },
      mockFetch,
    );

    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.body).toContain('-100111222333');
    expect(calls[1]?.body).toContain('-100111222333');
  });

  it('rejects with error when telegram API call fails', async () => {
    const mockFetch = vi.fn<FetchLike>(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: false }), { status: 401 })),
    );

    await expect(
      runTestNotify(
        {
          ...BASE_VALID_ENV,
          TELEGRAM_BOT_TOKEN: 'bad_token',
          TELEGRAM_CHAT_TECH: '-100111222333',
        },
        mockFetch,
      ),
    ).rejects.toThrow('telegram_status_401');
  });
});
