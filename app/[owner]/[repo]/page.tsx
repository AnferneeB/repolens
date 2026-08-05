import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TimelineSkeleton } from "./timeline-skeleton";
import { TimelineView } from "./timeline-view";

import { ErrorState, RefreshButton } from "@/components/error-state";
import {
  getRateLimitRetryAfter,
  isTRPCNotFound,
  isTRPCRateLimited,
  isValidOwnerRepoParams,
} from "@/lib/errors";
import { getQueryClient, HydrateClient, trpc } from "@/lib/trpc/server";

// Uncached builds can take ~10-15s on big repos (commit-activity 202
// backoff alone budgets ~15s) — don't let the platform default 504 first.
export const maxDuration = 60;

type RepoPageProps = {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ view?: string; sort?: string; hide?: string }>;
};

export async function generateMetadata({
  params,
}: RepoPageProps): Promise<Metadata> {
  const { owner, repo } = await params;

  if (!isValidOwnerRepoParams(owner, repo)) {
    return { title: `${owner}/${repo}` };
  }

  try {
    // Share the request-scoped QueryClient with the page so metadata + page
    // dedupe into a single timeline build on cache miss.
    const timeline = await getQueryClient().fetchQuery(
      trpc.timeline.get.queryOptions({ owner, repo }),
    );
    const { meta } = timeline;
    const title = meta.fullName;
    const description =
      meta.description ?? `Timeline for ${meta.fullName} on Repolens`;

    return {
      title,
      description,
      alternates: { canonical: `/${owner}/${repo}` },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/${owner}/${repo}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return { title: `${owner}/${repo}` };
  }
}

export default async function RepoPage({
  params,
  searchParams,
}: RepoPageProps) {
  const { owner, repo } = await params;
  const { view: viewParam } = await searchParams;
  const skeletonView = viewParam === "grouped" ? "grouped" : "timeline";

  if (!isValidOwnerRepoParams(owner, repo)) {
    return (
      <ErrorState
        description={
          <p>
            <code className="text-foreground">
              {owner}/{repo}
            </code>{" "}
            isn&apos;t a valid GitHub owner/repo. Use letters, numbers, dots,
            hyphens, or underscores — e.g. vercel/next.js.
          </p>
        }
        homeLabel="Home"
        title="Invalid repository"
      />
    );
  }

  const queryClient = getQueryClient();

  // Await so we dehydrate success (not a pending promise). That avoids the
  // "dehydrated as pending ended up rejecting" console error on NOT_FOUND.
  try {
    await queryClient.fetchQuery(
      trpc.timeline.get.queryOptions({ owner, repo }),
    );
  } catch (error) {
    if (isTRPCNotFound(error)) {
      notFound();
    }

    if (isTRPCRateLimited(error)) {
      const retryAfter = getRateLimitRetryAfter(error);
      const waitHint =
        retryAfter != null && retryAfter > 0
          ? `Try again in about ${retryAfter} seconds.`
          : "Try again in a minute.";

      return (
        <ErrorState
          description={
            <p>Rate limit reached. {waitHint} Cached repos still work.</p>
          }
          primaryAction={<RefreshButton />}
          title="Rate limit hit"
        />
      );
    }

    throw error;
  }

  return (
    <HydrateClient>
      <Suspense fallback={<TimelineSkeleton view={skeletonView} />}>
        <TimelineView owner={owner} repo={repo} />
      </Suspense>
    </HydrateClient>
  );
}
