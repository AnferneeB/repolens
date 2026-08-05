/**
 * Day 2 harness — print a JSON timeline for owner/repo.
 * Day 8: set REPOLENS_TIMING=1 (default here) for per-phase durations.
 *
 * Usage:
 *   bun run timeline vercel/next.js
 *   bun scripts/timeline.ts facebook/react
 *   REPOLENS_TIMING=0 bun run timeline vercel/next.js   # quiet timing
 */

import { buildTimeline } from "../lib/repolens";

const arg = process.argv[2];

if (!arg?.includes("/")) {
  console.error("Usage: bun run timeline <owner>/<repo>");
  process.exit(1);
}

const [owner, repo] = arg.split("/");

if (!owner || !repo) {
  console.error("Usage: bun run timeline <owner>/<repo>");
  process.exit(1);
}

if (!process.env.GITHUB_TOKEN) {
  console.warn(
    "Warning: GITHUB_TOKEN is unset — anonymous rate limit is 60 req/hr.\n",
  );
}

// Default on for the harness; opt out with REPOLENS_TIMING=0.
if (process.env.REPOLENS_TIMING === undefined) {
  process.env.REPOLENS_TIMING = "1";
}

try {
  const started = performance.now();
  const timeline = await buildTimeline(owner, repo);
  const elapsedMs = Math.round(performance.now() - started);
  const byType = timeline.events.reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});

  console.error(
    `OK ${timeline.meta.fullName} · ${timeline.events.length} events · cached=${timeline.cached} · ${elapsedMs}ms`,
  );
  console.error(`Types: ${JSON.stringify(byType)}`);
  console.log(JSON.stringify(timeline, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
