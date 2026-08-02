import "server-only";

import { Redis } from "@upstash/redis";

// undefined = not yet resolved; null = env missing.
let redis: Redis | null | undefined;

/**
 * Shared Upstash Redis client. Returns null when env is unset so callers
 * can no-op in local dev (same pattern as rate-limit / supabase).
 */
export function getRedis(): Redis | null {
  if (redis !== undefined) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redis = null;

    return redis;
  }

  redis = new Redis({ url, token });

  return redis;
}
