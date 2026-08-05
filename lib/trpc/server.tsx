import "server-only";

import type { TRPCQueryOptions } from "@trpc/tanstack-react-query";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cache } from "react";

import { makeQueryClient } from "@/lib/trpc/query-client";
import { appRouter } from "@/server/routers/_app";
import { createCallerFactory, createTRPCContext } from "@/server/trpc";

/**
 * Stable per-request QueryClient — required so prefetch + dehydrate
 * share the same cache within a single RSC render.
 */
export const getQueryClient = cache(makeQueryClient);

/**
 * Server-side options proxy for prefetching into the request QueryClient.
 * @see https://trpc.io/docs/client/nextjs/app-router-setup
 */
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

/**
 * In-process caller for Server Components that need data directly
 * (e.g. generateMetadata). Detached from the React Query cache.
 */
const createCaller = createCallerFactory(appRouter);

export const caller = createCaller(createTRPCContext);

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

// Matches the official App Router prefetch helper; queryOptions shape varies.
// biome-ignore lint/suspicious/noExplicitAny: tRPC docs pattern for prefetch helper
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();

  if (queryOptions.queryKey[1]?.type === "infinite") {
    // biome-ignore lint/suspicious/noExplicitAny: infinite options need cast
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}
