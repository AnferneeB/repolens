import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import superjson from "superjson";

/** Codes that will not succeed on retry — don't burn budget. */
const NON_RETRYABLE_TRPC_CODES = new Set([
  "NOT_FOUND",
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "TOO_MANY_REQUESTS",
  "PAYLOAD_TOO_LARGE",
  "CLIENT_CLOSED_REQUEST",
]);

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  if (error instanceof TRPCClientError) {
    const code = error.data?.code;

    if (typeof code === "string" && NON_RETRYABLE_TRPC_CODES.has(code)) {
      return false;
    }
  }

  return true;
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Client-session SWR: repeat navigations reuse dehydrate/cache for 5m,
        // then background-refetch. Durable cross-user cache is Supabase (24h).
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        retry: shouldRetryQuery,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
