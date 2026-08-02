# External setup checklist

Git init and `supabase init` are done. Local schema/migration generation is part of the app repo.

## Do now (unblocks the harness + error tracking)

1. **GitHub PAT** — create a classic or fine-grained token with public-repo read access. Put it in `.env.local` as `GITHUB_TOKEN=...`.
2. **Sentry** — create a free project, copy the DSN into `.env.local` as `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN`. Leave blank to keep Sentry disabled locally. For sourcemap upload on Vercel, also create an auth token and note the org slug + project slug.

## Local Supabase

```bash
bun run db:start          # Docker must be running
bun run db:reset          # applies generated migrations
```

Copy the printed `API URL` and `service_role` key into `.env.local`:

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=<service_role key from supabase start>
```

## Ship day (required for a working deploy)

Full command-level runbook: [`docs/DEPLOY.md`](DEPLOY.md).

1. Create a **cloud** Supabase project.
2. `supabase link --project-ref <ref>` then `supabase db push`. Confirm the
   `repo-snapshots-evict-stale` job exists (`select * from cron.job;`) and that
   RLS is enabled on `repo_snapshots`.
3. Create an **Upstash Redis** database (free tier) and set
   `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel —
   required for per-IP rate limiting, distributed build lock, and the
   global GitHub build budget.
4. Create a Vercel project from this repo and set env vars for **Production
   and Preview**:

   | Variable | Notes |
   | --- | --- |
   | `GITHUB_TOKEN` | Public-repo read PAT |
   | `SUPABASE_URL` | Cloud project URL |
   | `SUPABASE_SERVICE_KEY` | service_role key |
   | `UPSTASH_REDIS_REST_URL` | From Upstash |
   | `UPSTASH_REDIS_REST_TOKEN` | From Upstash |
   | `NEXT_PUBLIC_SITE_URL` | Stable alias, e.g. `https://repolens.vercel.app` |
   | `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | Optional but recommended |
   | `SENTRY_AUTH_TOKEN` | Sourcemap upload |
   | `SENTRY_ORG` / `SENTRY_PROJECT` | Sourcemap upload target |

5. Deploy. Confirm `/api/health` returns `{ ok: true }`, security headers are
   present, a cold repo page builds, a second load is a cache hit, and an OG
   unfurl does **not** trigger a cold GitHub build (cache-only).
6. Optional later: point a personal subdomain (e.g. `repolens.yourname.dev`)
   at Vercel and update `NEXT_PUBLIC_SITE_URL` + the README live badge.
7. Update `config/site.ts` `links.github` to the real public repo URL if needed.
8. Swap the README live badge from "deploy pending" to the production URL.
