import { TRPCError } from "@trpc/server";
import { describe, expect, test } from "bun:test";

import {
  getRateLimitRetryAfter,
  isTRPCBadRequest,
  isTRPCNotFound,
  isTRPCRateLimited,
  isValidOwnerRepoParams,
  RateLimitedError,
  RepoNotFoundError,
  toTRPCError,
  UpstreamError,
} from "./errors";

describe("toTRPCError", () => {
  test("maps RepoNotFoundError to NOT_FOUND", () => {
    const error = toTRPCError(new RepoNotFoundError("acme", "widget"));

    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toContain("acme/widget");
  });

  test("maps RateLimitedError to TOO_MANY_REQUESTS", () => {
    const error = toTRPCError(new RateLimitedError(42));

    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(error.cause).toBeInstanceOf(RateLimitedError);
  });

  test("maps UpstreamError to INTERNAL_SERVER_ERROR with a generic message", () => {
    const error = toTRPCError(
      new UpstreamError("GitHub returned HTTP 500", 500),
    );

    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.message).toBe(
      "Upstream service error. Try again in a moment.",
    );
    expect(error.message).not.toContain("GitHub returned");
  });

  test("passes through an existing TRPCError", () => {
    const original = new TRPCError({ code: "BAD_REQUEST" });

    expect(toTRPCError(original)).toBe(original);
  });

  test("wraps unknown values as INTERNAL_SERVER_ERROR", () => {
    const error = toTRPCError("boom");

    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});

describe("guards", () => {
  test("isTRPCNotFound", () => {
    expect(isTRPCNotFound(new TRPCError({ code: "NOT_FOUND" }))).toBe(true);
    expect(isTRPCNotFound(new TRPCError({ code: "BAD_REQUEST" }))).toBe(false);
    expect(isTRPCNotFound(new Error("nope"))).toBe(false);
  });

  test("isTRPCRateLimited", () => {
    expect(
      isTRPCRateLimited(new TRPCError({ code: "TOO_MANY_REQUESTS" })),
    ).toBe(true);
    expect(isTRPCRateLimited(new TRPCError({ code: "NOT_FOUND" }))).toBe(false);
  });

  test("isTRPCBadRequest", () => {
    expect(isTRPCBadRequest(new TRPCError({ code: "BAD_REQUEST" }))).toBe(true);
    expect(isTRPCBadRequest(null)).toBe(false);
  });
});

describe("getRateLimitRetryAfter", () => {
  test("reads seconds from a bare RateLimitedError", () => {
    expect(getRateLimitRetryAfter(new RateLimitedError(30))).toBe(30);
  });

  test("reads seconds through a TRPCError cause", () => {
    const wrapped = toTRPCError(new RateLimitedError(90));

    expect(getRateLimitRetryAfter(wrapped)).toBe(90);
  });

  test("returns null when absent", () => {
    expect(getRateLimitRetryAfter(new RateLimitedError())).toBeNull();
    expect(getRateLimitRetryAfter(new Error("x"))).toBeNull();
  });
});

describe("isValidOwnerRepoParams", () => {
  test("accepts normal owner/repo", () => {
    expect(isValidOwnerRepoParams("vercel", "next.js")).toBe(true);
    expect(isValidOwnerRepoParams("home-assistant", "core")).toBe(true);
  });

  test("rejects empty and over-length values", () => {
    expect(isValidOwnerRepoParams("", "repo")).toBe(false);
    expect(isValidOwnerRepoParams("a".repeat(40), "repo")).toBe(false);
    expect(isValidOwnerRepoParams("owner", "r".repeat(101))).toBe(false);
  });

  test("rejects invalid characters", () => {
    expect(isValidOwnerRepoParams("own er", "repo")).toBe(false);
    expect(isValidOwnerRepoParams("owner", "re/po")).toBe(false);
    expect(isValidOwnerRepoParams("owner", "re po")).toBe(false);
  });
});
