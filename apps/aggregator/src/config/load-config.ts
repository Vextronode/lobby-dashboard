import { readFileSync } from 'node:fs';
import type { z } from 'zod';
import { lobbyConfigSchema, type LobbyConfig } from './config-schema';
import { envSchema, type Env } from './env-schema';

export type LoadResult<T> = { ok: true; value: T } | { ok: false; message: string };

/** One line per issue, naming the field path, e.g. `modules.status.interval_s: Too small…`. */
export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.map(String).join('.') : '(root)';
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');
}

/** Validates the process environment. Values are never echoed back (guidelines §2.6). */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): LoadResult<Env> {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    return { ok: false, message: `Invalid environment:\n${formatIssues(result.error)}` };
  }
  return { ok: true, value: result.data };
}

/** Reads and validates `lobby.config.json`. */
export function loadConfig(path: string): LoadResult<LobbyConfig> {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    const reason = error instanceof SyntaxError ? 'not valid JSON' : 'cannot be read';
    return { ok: false, message: `Config file ${path} ${reason}.` };
  }
  return parseConfig(raw, path);
}

/** Validates an already-parsed config object. */
export function parseConfig(raw: unknown, source: string): LoadResult<LobbyConfig> {
  const result = lobbyConfigSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, message: `Invalid config (${source}):\n${formatIssues(result.error)}` };
  }
  return { ok: true, value: result.data };
}
