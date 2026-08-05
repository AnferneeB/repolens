import { describe, expect, test } from "bun:test";

import { cspReportEndpoint } from "./proxy";

describe("cspReportEndpoint", () => {
  test("derives Sentry's CSP collector from a DSN", () => {
    expect(
      cspReportEndpoint("https://abc123@o4507.ingest.us.sentry.io/4507890"),
    ).toBe(
      "https://o4507.ingest.us.sentry.io/api/4507890/security/?sentry_key=abc123",
    );
  });

  test("handles the non-US ingest host", () => {
    expect(cspReportEndpoint("https://key@o1.ingest.sentry.io/2")).toBe(
      "https://o1.ingest.sentry.io/api/2/security/?sentry_key=key",
    );
  });

  // A malformed DSN must degrade to "no reporting" rather than emitting a
  // broken directive, which would invalidate the whole policy.
  test("returns null rather than a partial directive", () => {
    expect(cspReportEndpoint(undefined)).toBeNull();
    expect(cspReportEndpoint("")).toBeNull();
    expect(cspReportEndpoint("not-a-url")).toBeNull();
    expect(cspReportEndpoint("https://o1.ingest.sentry.io/2")).toBeNull();
    expect(cspReportEndpoint("https://key@o1.ingest.sentry.io")).toBeNull();
  });
});
