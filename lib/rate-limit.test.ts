import { describe, expect, test } from "bun:test";

import { GLOBAL_BUILDS_PER_HOUR } from "./build-lock";
import { BURST_BUILDS, HOURLY_BUILDS } from "./rate-limit";

/**
 * The per-IP and global budgets have to be read together. A burst-only limit of
 * 10/min is 600/hr, which on its own let one client drain the 200/hr global
 * budget and deny uncached builds to everyone — so the relationship between
 * these numbers is the actual control, not any one of them.
 */
describe("build budgets", () => {
  test("a single IP cannot exhaust the global hourly budget", () => {
    expect(HOURLY_BUILDS).toBeLessThan(GLOBAL_BUILDS_PER_HOUR);
  });

  test("one IP is capped well below the global budget", () => {
    expect(HOURLY_BUILDS * 4).toBeLessThanOrEqual(GLOBAL_BUILDS_PER_HOUR);
  });

  test("the hourly cap binds before the burst window extrapolates past it", () => {
    expect(HOURLY_BUILDS).toBeLessThan(BURST_BUILDS * 60);
  });
});
