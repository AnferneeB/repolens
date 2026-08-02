import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";

export class RepoNotFoundError extends Error {
  readonly name = "RepoNotFoundError";

  constructor(owner: string, repo: string) {
    super(
      `We couldn't find ${owner}/${repo} — maybe it's private or the name is wrong?`,
    );
  }
}

export class RateLimitedError extends Error {
  readonly name = "RateLimitedError";
  readonly retryAfterSeconds: number | null;

  constructor(retryAfterSeconds: number | null = null) {
    const message =
      retryAfterSeconds != null && retryAfterSeconds > 0
        ? `GitHub rate limit hit. Try again in ~${retryAfterSeconds}s.`
        : "GitHub rate limit hit. Try again in a minute.";

    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class UpstreamError extends Error {
  readonly name = "UpstreamError";
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof RepoNotFoundError) {
    return new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof RateLimitedError) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof UpstreamError) {
    // Keep raw Octokit/GitHub wording server-side only — never surface it.
    Sentry.captureException(error);

    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Upstream service error. Try again in a moment.",
      cause: error,
    });
  }

  Sentry.captureException(error);

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong building the timeline.",
    cause: error,
  });
}

/** True when a tRPC procedure failed with NOT_FOUND (missing/private repo). */
export function isTRPCNotFound(error: unknown): boolean {
  return error instanceof TRPCError && error.code === "NOT_FOUND";
}

/** True when GitHub (or Octokit throttle) returned a rate limit. */
export function isTRPCRateLimited(error: unknown): boolean {
  return error instanceof TRPCError && error.code === "TOO_MANY_REQUESTS";
}

/** True when procedure input failed validation (bad owner/repo params). */
export function isTRPCBadRequest(error: unknown): boolean {
  return error instanceof TRPCError && error.code === "BAD_REQUEST";
}

/** Seconds until rate-limit reset, when present on the domain cause. */
export function getRateLimitRetryAfter(error: unknown): number | null {
  if (error instanceof RateLimitedError) {
    return error.retryAfterSeconds;
  }

  if (error instanceof TRPCError && error.cause instanceof RateLimitedError) {
    return error.cause.retryAfterSeconds;
  }

  return null;
}

const OWNER_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const REPO_PATTERN = /^[a-zA-Z0-9_.-]+$/;

/** Same shape as `timeline.get` zod input — use before calling GitHub. */
export function isValidOwnerRepoParams(owner: string, repo: string): boolean {
  return (
    owner.length >= 1 &&
    owner.length <= 39 &&
    OWNER_PATTERN.test(owner) &&
    repo.length >= 1 &&
    repo.length <= 100 &&
    REPO_PATTERN.test(repo)
  );
}
