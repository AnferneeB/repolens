import "server-only";

import {
  assertGlobalBuildBudget,
  tryAcquireBuildLock,
  waitForPeerBuild,
} from "@/lib/build-lock";
import { getSnapshot, upsertSnapshot } from "@/lib/cache";
import { RateLimitedError } from "@/lib/errors";
import {
  getCommitActivity,
  getContributorFirstCommit,
  getFirstCommit,
  getReleases,
  getRepo,
  getTopContributors,
} from "@/lib/github";
import {
  TIMELINE_SCHEMA_VERSION,
  type ActivitySpikeEvent,
  type Timeline,
  type TimelineEvent,
} from "@/types/timeline";

const SPIKE_STDDEV_MULTIPLIER = 1.5;
const MIN_SPIKE_COMMITS = 10;
/** Cap concurrent contributor first-commit lookups to avoid secondary rate limits. */
const CONTRIBUTOR_FETCH_CONCURRENCY = 4;

export type BuildTimelineOptions = {
  /**
   * When true, skip the initial Supabase read — the caller already confirmed
   * a miss (avoids a double round-trip on the cold path).
   */
  skipCacheRead?: boolean;
};

function timingEnabled() {
  return process.env.REPOLENS_TIMING === "1";
}

function logPhase(label: string, startedAt: number) {
  if (!timingEnabled()) {
    return;
  }

  console.error(`  ${label}: ${Math.round(performance.now() - startedAt)}ms`);
}

/**
 * In-flight builds keyed by owner/repo. Concurrent requests for the same
 * uncached repo (e.g. a viral share) collapse into one GitHub fan-out
 * within this server instance instead of N parallel ones. Cross-instance
 * coalescing is handled by the Redis build lock below.
 */
const inFlightBuilds = new Map<string, Promise<Timeline>>();

/**
 * Build a typed timeline for a public GitHub repo.
 * Uses Supabase cache when available and fresh (<24h, matching schema version).
 */
export async function buildTimeline(
  owner: string,
  repo: string,
  options: BuildTimelineOptions = {},
): Promise<Timeline> {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const existing = inFlightBuilds.get(key);

  if (existing) {
    return existing;
  }

  const build = buildTimelineUncoalesced(owner, repo, options).finally(() => {
    inFlightBuilds.delete(key);
  });

  inFlightBuilds.set(key, build);

  return build;
}

async function buildTimelineUncoalesced(
  owner: string,
  repo: string,
  options: BuildTimelineOptions,
): Promise<Timeline> {
  const totalStarted = performance.now();

  if (!options.skipCacheRead) {
    const cacheStarted = performance.now();
    const cached = await getSnapshot(owner, repo);

    logPhase("cache", cacheStarted);

    if (cached) {
      logPhase("total (hit)", totalStarted);

      return cached;
    }
  }

  // Cross-instance single-flight: only one instance fans out to GitHub.
  let lock = await tryAcquireBuildLock(owner, repo);

  if (!lock) {
    const landed = await waitForPeerBuild(
      owner,
      repo,
      async () => (await getSnapshot(owner, repo)) != null,
    );

    if (landed) {
      const peerCached = await getSnapshot(owner, repo);

      if (peerCached) {
        logPhase("total (peer hit)", totalStarted);

        return peerCached;
      }
    }

    // Peer failed or timed out — try to take over the build.
    lock = await tryAcquireBuildLock(owner, repo);

    if (!lock) {
      // Still locked; surface as a soft rate limit rather than double-build.
      throw new RateLimitedError(15);
    }
  }

  try {
    await assertGlobalBuildBudget();

    return await fetchAndAssembleTimeline(owner, repo, totalStarted);
  } finally {
    await lock.release();
  }
}

async function fetchAndAssembleTimeline(
  owner: string,
  repo: string,
  totalStarted: number,
): Promise<Timeline> {
  const metaStarted = performance.now();
  const meta = await getRepo(owner, repo);

  logPhase("meta", metaStarted);

  const parallelStarted = performance.now();
  const [firstCommit, releases, contributors, activity] = await Promise.all([
    getFirstCommit(meta.owner, meta.repo),
    getReleases(meta.owner, meta.repo, 100),
    getTopContributors(meta.owner, meta.repo, 10),
    getCommitActivity(meta.owner, meta.repo),
  ]);

  logPhase("parallel (first/releases/contributors/activity)", parallelStarted);

  const events: TimelineEvent[] = [];

  if (firstCommit) {
    events.push({
      type: "first_commit",
      id: `first-commit-${firstCommit.sha}`,
      date: firstCommit.date,
      title: "First commit",
      description: firstCommit.message,
      url: firstCommit.htmlUrl,
      sha: firstCommit.sha,
      authorLogin: firstCommit.authorLogin,
    });
  }

  for (const release of releases) {
    events.push({
      type: "release",
      id: `release-${release.id}`,
      date: release.publishedAt,
      title: release.name?.trim() || release.tagName,
      description: release.body?.slice(0, 280) ?? null,
      url: release.htmlUrl,
      tagName: release.tagName,
      isPrerelease: release.isPrerelease,
    });
  }

  const contributorsStarted = performance.now();
  const contributorCommits = await mapWithConcurrency(
    contributors,
    CONTRIBUTOR_FETCH_CONCURRENCY,
    async (contributor) => {
      const commit = await getContributorFirstCommit(
        meta.owner,
        meta.repo,
        contributor.login,
      );

      return { contributor, commit };
    },
  );

  logPhase("contributor first-commits", contributorsStarted);

  for (const { contributor, commit } of contributorCommits) {
    if (!commit) {
      continue;
    }

    // Skip if this is the same as the repo's first commit (already covered).
    if (firstCommit && commit.sha === firstCommit.sha) {
      continue;
    }

    events.push({
      type: "top_contributor",
      id: `contributor-${contributor.login}-${commit.sha}`,
      date: commit.date,
      title: `${contributor.login} joined`,
      description: `First commit · ${contributor.contributions.toLocaleString()} contributions total`,
      url: commit.htmlUrl,
      login: contributor.login,
      avatarUrl: contributor.avatarUrl,
      contributions: contributor.contributions,
    });
  }

  events.push(...detectActivitySpikes(activity, meta.htmlUrl));

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const timeline: Timeline = {
    schemaVersion: TIMELINE_SCHEMA_VERSION,
    meta: {
      owner: meta.owner,
      repo: meta.repo,
      fullName: meta.fullName,
      description: meta.description,
      htmlUrl: meta.htmlUrl,
      avatarUrl: meta.avatarUrl,
      stars: meta.stars,
      forks: meta.forks,
      language: meta.language,
      createdAt: meta.createdAt,
      pushedAt: meta.pushedAt,
    },
    events,
    fetchedAt: new Date(),
    cached: false,
  };

  const upsertStarted = performance.now();

  await upsertSnapshot(timeline);
  logPhase("upsert", upsertStarted);
  logPhase("total (miss)", totalStarted);

  return timeline;
}

/**
 * Run async work over items with a fixed concurrency pool (order preserved).
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      const item = items[index];

      if (item === undefined) {
        continue;
      }

      results[index] = await mapper(item, index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );

  await Promise.all(workers);

  return results;
}

export function detectActivitySpikes(
  weeks: { weekStart: Date; total: number }[],
  repoUrl: string,
): ActivitySpikeEvent[] {
  const active = weeks.filter((week) => week.total > 0);

  if (active.length < 4) {
    return [];
  }

  const totals = active.map((week) => week.total);
  const mean = totals.reduce((sum, n) => sum + n, 0) / totals.length;
  const variance =
    totals.reduce((sum, n) => sum + (n - mean) ** 2, 0) / totals.length;
  const stddev = Math.sqrt(variance);

  // Uniform activity has no outliers — without this guard the threshold
  // collapses to the mean and every week gets flagged as a spike.
  if (stddev === 0) {
    return [];
  }

  const threshold = Math.max(
    mean + SPIKE_STDDEV_MULTIPLIER * stddev,
    MIN_SPIKE_COMMITS,
  );

  // Cap spikes so huge repos stay readable.
  const spikes = active
    .filter((week) => week.total >= threshold)
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
    .map((week) => ({
      type: "activity_spike" as const,
      id: `spike-${week.weekStart.toISOString()}`,
      date: week.weekStart,
      title: "Commit activity spike",
      description: `${week.total.toLocaleString()} commits that week (threshold ${Math.round(threshold)})`,
      url: repoUrl,
      weekStart: week.weekStart,
      commits: week.total,
    }));

  return spikes;
}
