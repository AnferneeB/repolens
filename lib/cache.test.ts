import { describe, expect, test } from "bun:test";

import { reviveTimeline } from "./cache";

import { TIMELINE_SCHEMA_VERSION, type Timeline } from "@/types/timeline";

function makeTimeline(): Timeline {
  return {
    schemaVersion: TIMELINE_SCHEMA_VERSION,
    meta: {
      owner: "acme",
      repo: "widget",
      fullName: "acme/widget",
      description: "Test repo",
      htmlUrl: "https://github.com/acme/widget",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
      stars: 10,
      forks: 2,
      language: "TypeScript",
      createdAt: new Date("2020-01-01T00:00:00Z"),
      pushedAt: new Date("2026-07-01T00:00:00Z"),
    },
    events: [
      {
        type: "first_commit",
        id: "first-commit-abc",
        date: new Date("2020-01-02T00:00:00Z"),
        title: "First commit",
        description: "init",
        url: "https://github.com/acme/widget/commit/abc",
        sha: "abc",
        authorLogin: "alice",
      },
      {
        type: "activity_spike",
        id: "spike-2026-01-04",
        date: new Date("2026-01-04T00:00:00Z"),
        title: "Commit activity spike",
        description: "42 commits that week",
        url: "https://github.com/acme/widget",
        weekStart: new Date("2026-01-04T00:00:00Z"),
        commits: 42,
      },
    ],
    fetchedAt: new Date("2026-07-20T12:00:00Z"),
    cached: false,
  };
}

/** Simulate the JSONB round-trip: Dates become ISO strings. */
function jsonRoundTrip(timeline: Timeline): Timeline {
  return JSON.parse(JSON.stringify(timeline)) as Timeline;
}

describe("reviveTimeline", () => {
  test("revives all date fields from JSON strings", () => {
    const revived = reviveTimeline(jsonRoundTrip(makeTimeline()), true);

    expect(revived.fetchedAt).toBeInstanceOf(Date);
    expect(revived.meta.createdAt).toBeInstanceOf(Date);
    expect(revived.meta.pushedAt).toBeInstanceOf(Date);
    expect(revived.events[0]?.date).toBeInstanceOf(Date);

    const spike = revived.events[1];

    expect(spike?.type).toBe("activity_spike");

    if (spike?.type === "activity_spike") {
      expect(spike.weekStart).toBeInstanceOf(Date);
      expect(spike.weekStart.toISOString()).toBe("2026-01-04T00:00:00.000Z");
    }
  });

  test("sets the cached flag", () => {
    expect(reviveTimeline(jsonRoundTrip(makeTimeline()), true).cached).toBe(
      true,
    );
    expect(reviveTimeline(jsonRoundTrip(makeTimeline()), false).cached).toBe(
      false,
    );
  });

  test("handles null pushedAt", () => {
    const timeline = makeTimeline();

    timeline.meta.pushedAt = null;

    const revived = reviveTimeline(jsonRoundTrip(timeline), true);

    expect(revived.meta.pushedAt).toBeNull();
  });

  test("stamps the current schema version", () => {
    const revived = reviveTimeline(jsonRoundTrip(makeTimeline()), true);

    expect(revived.schemaVersion).toBe(TIMELINE_SCHEMA_VERSION);
  });
});
