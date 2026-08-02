import "server-only";

import { RateLimitedError } from "@/lib/errors";
import { getRedis } from "@/lib/redis";

/** Max uncached timeline builds across all instances per rolling hour. */
const GLOBAL_BUILDS_PER_HOUR = 200;
const GLOBAL_BUDGET_KEY = "repolens:github:builds:hour";
const GLOBAL_BUDGET_TTL_SECONDS = 60 * 60;

/** Lock TTL must cover a cold build (big repos ~10–15s) with margin. */
const LOCK_TTL_SECONDS = 60;
const LOCK_KEY_PREFIX = "repolens:buildlock:";

const WAIT_POLL_MS = 500;
const WAIT_MAX_MS = 30_000;

function lockKey(owner: string, repo: string): string {
  return `${LOCK_KEY_PREFIX}${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

/**
 * Try to acquire a per-repo single-flight lock. Returns a release token on
 * success, or null when another instance already holds the lock. No-ops
 * (returns a no-op token) when Redis env is unset.
 */
export async function tryAcquireBuildLock(
  owner: string,
  repo: string,
): Promise<{ token: string; release: () => Promise<void> } | null> {
  const redis = getRedis();

  if (!redis) {
    return {
      token: "local",
      release: async () => {},
    };
  }

  const key = lockKey(owner, repo);
  const token = crypto.randomUUID();
  const acquired = await redis.set(key, token, {
    nx: true,
    ex: LOCK_TTL_SECONDS,
  });

  if (acquired !== "OK") {
    return null;
  }

  return {
    token,
    release: async () => {
      // Only delete if we still own the lock (avoid racing a TTL expiry).
      const current = await redis.get<string>(key);

      if (current === token) {
        await redis.del(key);
      }
    },
  };
}

/**
 * Wait for another instance's in-flight build to land in the cache.
 * Returns true when the caller should re-check the snapshot; false when
 * the wait timed out (caller may retry acquire or fail).
 */
export async function waitForPeerBuild(
  owner: string,
  repo: string,
  hasSnapshot: () => Promise<boolean>,
): Promise<boolean> {
  const redis = getRedis();
  const started = Date.now();

  while (Date.now() - started < WAIT_MAX_MS) {
    if (await hasSnapshot()) {
      return true;
    }

    if (redis) {
      const held = await redis.exists(lockKey(owner, repo));

      if (!held) {
        // Lock released without a snapshot (peer failed) — let caller retry.
        return false;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, WAIT_POLL_MS));
  }

  return hasSnapshot();
}

/**
 * Consume one slot from the global uncached-build budget. Throws
 * `RateLimitedError` when exhausted. No-ops when Redis env is unset.
 */
export async function assertGlobalBuildBudget(): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const count = await redis.incr(GLOBAL_BUDGET_KEY);

  if (count === 1) {
    await redis.expire(GLOBAL_BUDGET_KEY, GLOBAL_BUDGET_TTL_SECONDS);
  }

  if (count > GLOBAL_BUILDS_PER_HOUR) {
    // Don't leave a permanently inflated counter if we're over — just reject.
    throw new RateLimitedError(60);
  }
}
