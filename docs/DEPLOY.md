# Deploy runbook (Day 10)

Code is ship-ready. These steps require your cloud account logins.

## 1. Cloud Supabase

```bash
supabase login
supabase projects create repolens --org-id <org> --db-password <password> --region us-east-1
supabase link --project-ref <ref>
supabase db push
```

Verify:

```sql
select * from cron.job where jobname = 'repo-snapshots-evict-stale';
select relrowsecurity from pg_class where relname = 'repo_snapshots';
```

Copy the project URL and `service_role` key into Vercel (below).

## 2. Upstash Redis

1. Create a free Redis database at https://console.upstash.com
2. Copy REST URL + REST TOKEN

## 3. Vercel

```bash
vercel login
vercel link   # create/link the project
```

Set env for **Production** and **Preview**:

```bash
vercel env add GITHUB_TOKEN
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add NEXT_PUBLIC_SITE_URL   # https://repolens.vercel.app
vercel env add NEXT_PUBLIC_SENTRY_DSN
vercel env add SENTRY_DSN
vercel env add SENTRY_AUTH_TOKEN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
```

Deploy:

```bash
vercel --prod
```

Then pin `NEXT_PUBLIC_SITE_URL` to the stable production alias (not a
`*-git-*-*.vercel.app` deployment URL).

## 4. Post-deploy smoke test

- `GET /api/health` → `{ "ok": true }`
- Response headers include `strict-transport-security`, `x-frame-options`,
  `content-security-policy-report-only`
- Cold repo page (e.g. `/vercel/next.js`) builds successfully
- Immediate reload is a cache hit (fast)
- Invalid slug (e.g. `/not a/repo`) shows inline error without GitHub calls
- Private/missing repo → not-found UI
- OG image for an uncached repo renders the branded fallback (no GitHub fan-out)
- After one page load has warmed the cache, OG image shows avatar + description

## 5. README polish

1. Replace the live badge URL with `https://repolens.vercel.app`
2. Capture `docs/screenshot.png` from a timeline page and uncomment the image in `README.md`
3. Confirm `config/site.ts` `links.github` points at the public repo
