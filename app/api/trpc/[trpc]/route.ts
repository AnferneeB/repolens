import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

// Timeline builds on big repos can exceed default serverless limits.
export const maxDuration = 60;

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    // Single procedure surface today; keep batch size tiny as a backstop.
    maxBatchSize: 5,
  });

export { handler as GET, handler as POST };
