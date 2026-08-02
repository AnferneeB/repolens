import { initTRPC } from "@trpc/server";
import { headers } from "next/headers";
import superjson from "superjson";

/**
 * Prefer platform-trusted forwarding headers. Vercel sets
 * `x-vercel-forwarded-for` to the real client IP; leftmost XFF is only a
 * last resort because some proxies append a client-spoofable value.
 */
function clientIp(requestHeaders: Headers): string | null {
  return (
    requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

export async function createTRPCContext() {
  let ip: string | null = null;

  try {
    const requestHeaders = await headers();

    ip = clientIp(requestHeaders);
  } catch {
    // Outside a request scope (e.g. build-time) — no IP available.
  }

  return { ip };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
