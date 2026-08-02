import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { getSnapshot } from "@/lib/cache";
import { toTRPCError } from "@/lib/errors";
import { assertBuildWithinRateLimit } from "@/lib/rate-limit";
import { buildTimeline } from "@/lib/repolens";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

const ownerRepoInput = z.object({
  owner: z
    .string()
    .min(1)
    .max(39)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  repo: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/),
});

export const timelineRouter = createTRPCRouter({
  get: publicProcedure.input(ownerRepoInput).query(async ({ input, ctx }) => {
    try {
      // Cache hits are free; only uncached builds (GitHub fan-out) spend
      // the per-IP budget. Pass skipCacheRead so buildTimeline doesn't
      // re-read Supabase on the miss path.
      const cached = await getSnapshot(input.owner, input.repo);

      if (cached) {
        return cached;
      }

      await assertBuildWithinRateLimit(ctx.ip);

      return await buildTimeline(input.owner, input.repo, {
        skipCacheRead: true,
      });
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});

// Re-export for convenience when mapping HTTP status elsewhere.
export { TRPCError };
