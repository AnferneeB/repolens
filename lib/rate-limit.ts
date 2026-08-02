import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { RateLimitedError } from "@/lib/errors";
import { getRedis } from "@/lib/redis";

/**
 * Per-IP budget for uncached timeline builds (each one fans out ~6+ GitHub
 * calls on the shared token). Cache hits are exempt — see timeline router.
 */
const BUILDS_PER_WINDOW = 10;
const WINDOW = "60 s";

// undefined = not yet resolved; null = env missing, limiter disabled.
let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) {
    return limiter;
  }

  const redis = getRedis();

  if (!redis) {
    limiter = null;

    return limiter;
  }

  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(BUILDS_PER_WINDOW, WINDOW),
    prefix: "repolens:build",
  });

  return limiter;
}

/**
 * Throws `RateLimitedError` when the caller has exhausted their uncached-build
 * budget. No-ops when Upstash env is unset (local dev). When the limiter is
 * configured but Redis is unreachable, fails closed so an outage cannot
 * silently remove abuse protection on a deployed host.
 */
export async function assertBuildWithinRateLimit(
  ip: string | null,
): Promise<void> {
  const limit = getLimiter();

  if (!limit) {
    return;
  }

  let result: Awaited<ReturnType<Ratelimit["limit"]>>;

  try {
    result = await limit.limit(ip ?? "unknown");
  } catch (error) {
    console.error("rate-limit check failed (failing closed):", error);

    throw new RateLimitedError(60);
  }

  if (!result.success) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000),
    );

    throw new RateLimitedError(retryAfterSeconds);
  }
}
