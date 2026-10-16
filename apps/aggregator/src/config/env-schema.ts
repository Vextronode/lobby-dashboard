import { z } from 'zod';

const DEFAULT_PORT = 8080;

const optionalSecretSchema = z.string().min(1).optional();

/** Process environment. Secrets and upstream URLs live only here (FR-8, guidelines §2.6). */
export const envSchema = z.object({
  SIGAP_BASE_URL: z.url(),
  SID_BASE_URL: z.url(),
  CIMART_BASE_URL: z.url(),
  /** Without a token notifications are disabled; nothing else is affected (F14 R-8). */
  TELEGRAM_BOT_TOKEN: optionalSecretSchema,
  TELEGRAM_CHAT_TECH: optionalSecretSchema,
  TELEGRAM_CHAT_ADMIN: optionalSecretSchema,
  DATA_DIR: z.string().min(1).default('./data'),
  LOBBY_CONFIG_PATH: z.string().min(1).default('config/lobby.config.json'),
  /** 0 = any free port (tests). */
  PORT: z.coerce.number().int().min(0).max(65535).default(DEFAULT_PORT),
});

export type Env = z.infer<typeof envSchema>;
