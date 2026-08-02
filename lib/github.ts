import "server-only";

import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";

import {
  RateLimitedError,
  RepoNotFoundError,
  UpstreamError,
} from "@/lib/errors";

const MyOctokit = Octokit.plugin(retry, throttling);

export type GitHubRepo = Awaited<ReturnType<typeof getRepo>>;
export type GitHubCommit = {
  sha: string;
  htmlUrl: string;
  message: string;
  authorLogin: string | null;
  date: Date;
};
export type GitHubRelease = {
  id: number;
  tagName: string;
  name: string | null;
  htmlUrl: string;
  publishedAt: Date;
  body: string | null;
  isPrerelease: boolean;
};
export type GitHubContributor = {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  contributions: number;
};
export type CommitActivityWeek = {
  weekStart: Date;
  total: number;
};

let cachedClient: InstanceType<typeof MyOctokit> | null = null;

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const auth = process.env.GITHUB_TOKEN;

  cachedClient = new MyOctokit({
    auth: auth || undefined,
    userAgent: "repolens/0.1",
    throttle: {
      onRateLimit: (retryAfter, options, _octokit, retryCount) => {
        if (retryCount < 1) {
          return true;
        }

        throw new RateLimitedError(retryAfter);
      },
      onSecondaryRateLimit: (retryAfter, _options, _octokit, retryCount) => {
        if (retryCount < 1) {
          return true;
        }

        throw new RateLimitedError(retryAfter);
      },
    },
  });

  return cachedClient;
}

function mapOctokitError(error: unknown, owner: string, repo: string): never {
  if (
    error instanceof RateLimitedError ||
    error instanceof RepoNotFoundError ||
    error instanceof UpstreamError
  ) {
    throw error;
  }

  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;

  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";

  if (status === 404) {
    throw new RepoNotFoundError(owner, repo);
  }

  if (status === 429) {
    throw new RateLimitedError();
  }

  if (status === 403) {
    const remaining =
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { headers?: Record<string, string> } })
        .response?.headers?.["x-ratelimit-remaining"] === "string"
        ? (error as { response: { headers: Record<string, string> } }).response
            .headers["x-ratelimit-remaining"]
        : undefined;

    if (remaining === "0" || /rate limit/i.test(message)) {
      throw new RateLimitedError();
    }

    throw new UpstreamError(
      message || `GitHub forbidden (HTTP 403) for ${owner}/${repo}`,
      403,
    );
  }

  if (status !== undefined) {
    throw new UpstreamError(`GitHub returned HTTP ${status}`, status);
  }

  throw new UpstreamError(
    error instanceof Error ? error.message : "Unknown GitHub error",
  );
}

export async function getRepo(owner: string, repo: string) {
  const octokit = getClient();

  try {
    const { data } = await octokit.repos.get({ owner, repo });

    return {
      owner: data.owner.login,
      repo: data.name,
      fullName: data.full_name,
      description: data.description,
      htmlUrl: data.html_url,
      avatarUrl: data.owner.avatar_url,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      createdAt: new Date(data.created_at),
      pushedAt: data.pushed_at ? new Date(data.pushed_at) : null,
      defaultBranch: data.default_branch,
    };
  } catch (error) {
    mapOctokitError(error, owner, repo);
  }
}

/**
 * First commit via Link-header trick: request 1 commit, jump to the last page.
 */
export async function getFirstCommit(
  owner: string,
  repo: string,
): Promise<GitHubCommit | null> {
  const octokit = getClient();

  try {
    const firstPage = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 1,
    });

    if (firstPage.data.length === 0) {
      return null;
    }

    const link = firstPage.headers.link;
    let page = 1;

    if (link) {
      const lastMatch = /[?&]page=(\d+)>; rel="last"/.exec(link);

      if (lastMatch) {
        page = Number(lastMatch[1]);
      }
    }

    const lastPage =
      page === 1
        ? firstPage
        : await octokit.repos.listCommits({
            owner,
            repo,
            per_page: 1,
            page,
          });

    const commit = lastPage.data[0];

    if (!commit) {
      return null;
    }

    return {
      sha: commit.sha,
      htmlUrl: commit.html_url,
      message: commit.commit.message.split("\n")[0] ?? commit.commit.message,
      authorLogin: commit.author?.login ?? commit.commit.author?.name ?? null,
      date: new Date(
        commit.commit.author?.date ??
          commit.commit.committer?.date ??
          new Date().toISOString(),
      ),
    };
  } catch (error) {
    mapOctokitError(error, owner, repo);
  }
}

export async function getReleases(
  owner: string,
  repo: string,
  limit = 100,
): Promise<GitHubRelease[]> {
  const octokit = getClient();

  try {
    // Releases are newest-first. Early-stop once we have `limit` so
    // release-heavy repos (thousands of tags) don't paginate the entire list.
    let collected = 0;
    const releases = await octokit.paginate(
      octokit.repos.listReleases,
      {
        owner,
        repo,
        per_page: Math.min(100, limit),
      },
      (response, done) => {
        collected += response.data.length;

        if (collected >= limit) {
          done();
        }

        return response.data;
      },
    );

    return releases.slice(0, limit).flatMap((release) => {
      if (!release.published_at && !release.created_at) {
        return [];
      }

      return [
        {
          id: release.id,
          tagName: release.tag_name,
          name: release.name,
          htmlUrl: release.html_url,
          publishedAt: new Date(release.published_at ?? release.created_at),
          body: release.body ?? null,
          isPrerelease: release.prerelease,
        },
      ];
    });
  } catch (error) {
    mapOctokitError(error, owner, repo);
  }
}

export async function getTopContributors(
  owner: string,
  repo: string,
  limit = 10,
): Promise<GitHubContributor[]> {
  const octokit = getClient();

  try {
    const { data } = await octokit.repos.listContributors({
      owner,
      repo,
      per_page: limit,
    });

    return data
      .filter((contributor) => contributor.login && contributor.type === "User")
      .slice(0, limit)
      .map((contributor) => ({
        login: contributor.login!,
        avatarUrl: contributor.avatar_url ?? "",
        htmlUrl:
          contributor.html_url ?? `https://github.com/${contributor.login}`,
        contributions: contributor.contributions,
      }));
  } catch (error) {
    // Mega-repos (e.g. torvalds/linux) return 403 when the contributor list
    // is too large for the API — soft-fail so the rest of the timeline builds.
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : undefined;
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : "";

    if (
      status === 403 &&
      /contributor list is too large|history or contributor list is too large/i.test(
        message,
      )
    ) {
      return [];
    }

    mapOctokitError(error, owner, repo);
  }
}

/**
 * First commit for a specific author (used for top-contributor events).
 */
export async function getContributorFirstCommit(
  owner: string,
  repo: string,
  author: string,
): Promise<GitHubCommit | null> {
  const octokit = getClient();

  try {
    const firstPage = await octokit.repos.listCommits({
      owner,
      repo,
      author,
      per_page: 1,
    });

    if (firstPage.data.length === 0) {
      return null;
    }

    const link = firstPage.headers.link;
    let page = 1;

    if (link) {
      const lastMatch = /[?&]page=(\d+)>; rel="last"/.exec(link);

      if (lastMatch) {
        page = Number(lastMatch[1]);
      }
    }

    const lastPage =
      page === 1
        ? firstPage
        : await octokit.repos.listCommits({
            owner,
            repo,
            author,
            per_page: 1,
            page,
          });

    const commit = lastPage.data[0];

    if (!commit) {
      return null;
    }

    return {
      sha: commit.sha,
      htmlUrl: commit.html_url,
      message: commit.commit.message.split("\n")[0] ?? commit.commit.message,
      authorLogin: commit.author?.login ?? author,
      date: new Date(
        commit.commit.author?.date ??
          commit.commit.committer?.date ??
          new Date().toISOString(),
      ),
    };
  } catch (error) {
    // Contributor may have no commits addressable by author filter — soft fail.
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : undefined;

    if (status === 404 || status === 422) {
      return null;
    }

    mapOctokitError(error, owner, repo);
  }
}

/**
 * 52-week commit activity. GitHub may return 202 while computing — retry with backoff.
 * Big repos often need a few extra attempts; keep the budget modest (~15s worst case).
 */
export async function getCommitActivity(
  owner: string,
  repo: string,
  attempts = 6,
): Promise<CommitActivityWeek[]> {
  const octokit = getClient();

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await octokit.repos.getCommitActivityStats({
        owner,
        repo,
      });

      if (response.status === 202 || response.data === undefined) {
        if (attempt === attempts - 1) {
          return [];
        }

        await sleep(1000 * (attempt + 1));
        continue;
      }

      return (response.data ?? []).map((week) => ({
        weekStart: new Date(week.week * 1000),
        total: week.total,
      }));
    } catch (error) {
      mapOctokitError(error, owner, repo);
    }
  }

  return [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
