import { createTRPCRouter } from "@/server/trpc";
import { timelineRouter } from "@/server/routers/timeline";

export const appRouter = createTRPCRouter({
  timeline: timelineRouter,
});

export type AppRouter = typeof appRouter;
