import { initTRPC } from "@trpc/server";
import { headers } from "next/headers";
import superjson from "superjson";

/**
 * Prefer platform-trusted forwarding headers. Vercel overwrites
 * `x-vercel-forwarded-for` with the real client IP, so clients cannot forge
 * it. The `x-real-ip` / `x-forwarded-for` fallbacks are only safe on hosts that
 * do the same — if this app is ever moved off Vercel, drop those fallbacks or
 * terminate TLS at a proxy that strips client-supplied copies first.
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
