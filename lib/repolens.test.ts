import { describe, expect, test } from "bun:test";

import { detectActivitySpikes } from "./repolens";

const REPO_URL = "https://github.com/acme/widget";

function week(iso: string, total: number) {
  return { weekStart: new Date(iso), total };
}

describe("detectActivitySpikes", () => {
  test("returns [] with fewer than 4 active weeks", () => {
    const weeks = [
      week("2026-01-04", 50),
      week("2026-01-11", 0),
      week("2026-01-18", 3),
      week("2026-01-25", 200),
    ];

    // Only 3 weeks have activity > 0.
    expect(detectActivitySpikes(weeks, REPO_URL)).toEqual([]);
  });

  test("returns [] for uniform activity (nothing above threshold)", () => {
    const weeks = Array.from({ length: 10 }, (_, i) =>
      week(`2026-0${Math.floor(i / 4) + 1}-0${(i % 4) + 1}`, 20),
    );

    expect(detectActivitySpikes(weeks, REPO_URL)).toEqual([]);
  });

  test("detects an obvious spike", () => {
    const weeks = [
      week("2026-01-04", 10),
      week("2026-01-11", 12),
      week("2026-01-18", 9),
      week("2026-01-25", 11),
      week("2026-02-01", 10),
      week("2026-02-08", 120),
    ];

    const spikes = detectActivitySpikes(weeks, REPO_URL);

    expect(spikes).toHaveLength(1);
    expect(spikes[0]?.type).toBe("activity_spike");
    expect(spikes[0]?.commits).toBe(120);
    expect(spikes[0]?.weekStart).toEqual(new Date("2026-02-08"));
    expect(spikes[0]?.url).toBe(REPO_URL);
  });

  test("ignores spikes below the 10-commit floor", () => {
    // Statistical outlier, but below MIN_SPIKE_COMMITS.
    const weeks = [
      week("2026-01-04", 1),
      week("2026-01-11", 1),
      week("2026-01-18", 1),
      week("2026-01-25", 1),
      week("2026-02-01", 8),
    ];

    expect(detectActivitySpikes(weeks, REPO_URL)).toEqual([]);
  });

  test("caps output at 12 spikes", () => {
    const calm = Array.from({ length: 40 }, (_, i) =>
      week(new Date(Date.UTC(2026, 0, 1 + i * 7)).toISOString(), 5),
    );
    const spiky = Array.from({ length: 15 }, (_, i) =>
      week(new Date(Date.UTC(2025, 0, 1 + i * 7)).toISOString(), 1000 + i),
    );

    const spikes = detectActivitySpikes([...calm, ...spiky], REPO_URL);

    expect(spikes).toHaveLength(12);
  });
});
