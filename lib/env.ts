import "server-only";

import { z } from "zod";

/**
 * Vars the app degrades badly without on a deployed host: no GITHUB_TOKEN
 * means the 60/hr anonymous limit; no Supabase means every request hits
 * GitHub; no Upstash means uncached builds are unlimited; no site URL means
 * OG/canonical URLs point at per-deployment Vercel hostnames.
 */
const deployedEnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

/** Missing these only weakens observability — warn, don't fail. */
const recommendedDeployedVars = ["NEXT_PUBLIC_SENTRY_DSN"] as const;

/**
 * Runtime-only check (called from instrumentation register, never at build —
 * CI builds legitimately run without env). Throws on Vercel production and
 * preview so a misconfigured deploy fails loudly instead of silently running
 * cache-less / unlimited against GitHub. Local `next start` is not treated
 * as deployed (no `VERCEL_ENV`) so smoke tests still work with `.env.local`.
 */
export function assertServerEnv(): void {
  const vercelEnv = process.env.VERCEL_ENV;
  const isDeployed = vercelEnv === "production" || vercelEnv === "preview";

  if (!isDeployed) {
    return;
  }

  const result = deployedEnvSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join("."));

    throw new Error(
      `Missing/invalid required deployed env: ${missing.join(", ")}. ` +
        "Set these in the deployment environment (see .env.example).",
    );
  }

  for (const name of recommendedDeployedVars) {
    if (!process.env[name]) {
      console.warn(
        `Deployed env ${name} is unset — error tracking is disabled.`,
      );
    }
  }
}
