export const TIMELINE_SCHEMA_VERSION = 1 as const;

export type RepoMeta = {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  avatarUrl: string;
  stars: number;
  forks: number;
  language: string | null;
  createdAt: Date;
  pushedAt: Date | null;
};

export type FirstCommitEvent = {
  type: "first_commit";
  id: string;
  date: Date;
  title: string;
  description: string | null;
  url: string;
  sha: string;
  authorLogin: string | null;
};

export type ReleaseEvent = {
  type: "release";
  id: string;
  date: Date;
  title: string;
  description: string | null;
  url: string;
  tagName: string;
  isPrerelease: boolean;
};

export type TopContributorEvent = {
  type: "top_contributor";
  id: string;
  date: Date;
  title: string;
  description: string | null;
  url: string;
  login: string;
  avatarUrl: string;
  contributions: number;
};

export type ActivitySpikeEvent = {
  type: "activity_spike";
  id: string;
  date: Date;
  title: string;
  description: string | null;
  url: string | null;
  weekStart: Date;
  commits: number;
};

export type TimelineEvent =
  | FirstCommitEvent
  | ReleaseEvent
  | TopContributorEvent
  | ActivitySpikeEvent;

export type Timeline = {
  schemaVersion: typeof TIMELINE_SCHEMA_VERSION;
  meta: RepoMeta;
  events: TimelineEvent[];
  fetchedAt: Date;
  cached: boolean;
};
