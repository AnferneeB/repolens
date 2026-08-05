import "server-only";

import * as Sentry from "@sentry/nextjs";

import { getSupabase } from "@/lib/supabase";
import { TIMELINE_SCHEMA_VERSION, type Timeline } from "@/types/timeline";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type SnapshotRow = {
  owner: string;
  repo: string;
  schema_version: number;
  fetched_at: string;
  data: Timeline;
};

export function reviveTimeline(raw: Timeline, cached: boolean): Timeline {
  return {
    ...raw,
    schemaVersion: TIMELINE_SCHEMA_VERSION,
    cached,
    fetchedAt: new Date(raw.fetchedAt),
    meta: {
      ...raw.meta,
      createdAt: new Date(raw.meta.createdAt),
      pushedAt: raw.meta.pushedAt ? new Date(raw.meta.pushedAt) : null,
    },
    events: raw.events.map((event) => {
      const base = { ...event, date: new Date(event.date) };

      if (event.type === "activity_spike") {
        return { ...base, weekStart: new Date(event.weekStart) };
      }

      return base;
    }),
  };
}

async function deleteSnapshot(owner: string, repo: string): Promise<void> {
  const supabase = getSupabase();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("repo_snapshots")
    .delete()
    .eq("owner", owner.toLowerCase())
    .eq("repo", repo.toLowerCase());

  if (error) {
    console.error(`cache delete failed for ${owner}/${repo}:`, error);
    Sentry.captureException(error, {
      tags: { cache: "delete", owner, repo },
    });
  }
}

export async function getSnapshot(
  owner: string,
  repo: string,
): Promise<Timeline | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("repo_snapshots")
    .select("owner, repo, schema_version, fetched_at, data")
    .eq("owner", owner.toLowerCase())
    .eq("repo", repo.toLowerCase())
    .maybeSingle<SnapshotRow>();

  if (error) {
    // A broken cache read silently downgrades every request to a GitHub
    // build (and spends the caller's rate-limit budget) — make it visible.
    console.error(`cache read failed for ${owner}/${repo}:`, error);
    Sentry.captureException(error, {
      tags: { cache: "read", owner, repo },
    });

    return null;
  }

  if (!data) {
    return null;
  }

  if (data.schema_version !== TIMELINE_SCHEMA_VERSION) {
    // Don't leave dead rows until the 48h cron — delete on mismatch.
    void deleteSnapshot(owner, repo);

    return null;
  }

  const age = Date.now() - new Date(data.fetched_at).getTime();

  if (age > CACHE_TTL_MS) {
    return null;
  }

  return reviveTimeline(data.data, true);
}

export async function upsertSnapshot(timeline: Timeline): Promise<void> {
  const supabase = getSupabase();

  if (!supabase) {
    return;
  }

  const owner = timeline.meta.owner.toLowerCase();
  const repo = timeline.meta.repo.toLowerCase();

  const { error } = await supabase.from("repo_snapshots").upsert(
    {
      owner,
      repo,
      schema_version: TIMELINE_SCHEMA_VERSION,
      fetched_at: new Date().toISOString(),
      data: { ...timeline, cached: false },
    },
    { onConflict: "owner,repo" },
  );

  if (error) {
    // A failed write turns every future request into a cache miss.
    console.error(`cache write failed for ${owner}/${repo}:`, error);
    Sentry.captureException(error, {
      tags: { cache: "write", owner, repo },
    });
  }
}
