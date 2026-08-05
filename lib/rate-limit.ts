import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { RateLimitedError } from "@/lib/errors";
import { getRedis } from "@/lib/redis";

/**
 * Per-IP budgets for uncached timeline builds (each one fans out ~6+ GitHub
 * calls on the shared token). Cache hits are exempt — see timeline router.
 *
 * The burst window alone was not enough: 10 per minute is 600 per hour, which
 * on its own could drain the 200/hour global budget in `lib/build-lock.ts` and
 * deny the feature to everyone. The hourly cap keeps any single client to a
 * fraction of the shared allowance, so exhausting it takes a real botnet.
 */
export const BURST_BUILDS = 10;
const BURST_WINDOW = "60 s";

export const HOURLY_BUILDS = 30;
const HOURLY_WINDOW = "1 h";

// undefined = not yet resolved; null = env missing, limiters disabled.
let limiters: Ratelimit[] | null | undefined;

function getLimiters(): Ratelimit[] | null {
  if (limiters !== undefined) {
    return limiters;
  }

  const redis = getRedis();

  if (!redis) {
    limiters = null;

    return limiters;
  }

  limiters = [
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(BURST_BUILDS, BURST_WINDOW),
      prefix: "repolens:build:burst",
    }),
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(HOURLY_BUILDS, HOURLY_WINDOW),
      prefix: "repolens:build:hour",
    }),
  ];

  return limiters;
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
  const limits = getLimiters();

  if (!limits) {
    return;
  }

  const identifier = ip ?? "unknown";

  let results: Awaited<ReturnType<Ratelimit["limit"]>>[];

  try {
    results = await Promise.all(limits.map((limit) => limit.limit(identifier)));
  } catch (error) {
    console.error("rate-limit check failed (failing closed):", error);

    throw new RateLimitedError(60);
  }

  const exceeded = results.find((result) => !result.success);

  if (exceeded) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((exceeded.reset - Date.now()) / 1000),
    );

    throw new RateLimitedError(retryAfterSeconds);
  }
}
