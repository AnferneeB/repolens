-- Evict stale repo_snapshots rows nightly. The app enforces a 24h TTL on
-- reads (lib/cache.ts); without this job stale rows accumulate forever.
-- 48h retention keeps a stale-serve buffer while bounding table growth.
-- cron.schedule() upserts by job name, so re-running is safe.
select cron.schedule(
  'repo-snapshots-evict-stale',
  '17 3 * * *',
  $$ delete from public.repo_snapshots where fetched_at < now() - interval '48 hours' $$
);
