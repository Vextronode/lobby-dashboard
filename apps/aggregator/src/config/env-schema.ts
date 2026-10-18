import { z } from 'zod';

const DEFAULT_PORT = 8080;

/** `KEY=` in an env file means "not set". */
const emptyAsUnset = (value: unknown) => (value === '' ? undefined : value);

const optionalStringSchema = z.preprocess(emptyAsUnset, z.string().min(1).optional());

/** Process environment. Secrets and upstream URLs live only here (FR-8, guidelines §2.6). */
export const envSchema = z.object({
  SIGAP_BASE_URL: z.url(),
  SID_BASE_URL: z.url(),
  CIMART_BASE_URL: z.url(),
  /** Without a token notifications are disabled; nothing else is affected (F14 R-8). */
  TELEGRAM_BOT_TOKEN: optionalStringSchema,
  TELEGRAM_CHAT_TECH: optionalStringSchema,
  /** Without an admin chat, admin messages go to the tech chat (F14 R-9). */
  TELEGRAM_CHAT_ADMIN: optionalStringSchema,
  DATA_DIR: z.string().min(1).default('./data'),
  LOBBY_CONFIG_PATH: z.string().min(1).default('config/lobby.config.json'),
  /** 0 = any free port (tests). */
  PORT: z.coerce.number().int().min(0).max(65535).default(DEFAULT_PORT),
  /** Version reported as `build`; a change makes the TV reload (F13 R-5). */
  BUILD_ID: z.preprocess(emptyAsUnset, z.string().min(1).default('dev')),
  /** Built `apps/web` to serve; unset = API only (dev uses Vite). */
  WEB_DIST_DIR: optionalStringSchema,
  /** Behind a reverse proxy, take the client IP for rate limiting from `X-Forwarded-For`. */
  TRUST_PROXY: z
    .preprocess(emptyAsUnset, z.enum(['true', 'false']).default('false'))
    .transform((value) => value === 'true'),
});

export type Env = z.infer<typeof envSchema>;
