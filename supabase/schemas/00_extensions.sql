-- Extensions required by Repolens.
-- pg_cron powers the nightly eviction of stale repo_snapshots rows
-- (the 24h TTL in lib/cache.ts is read-side only; the cron job is the
-- write-side cleanup). The job itself is registered in a migration —
-- cron.schedule() is a function call, not schema DDL, so `db diff`
-- cannot express it declaratively.
create extension if not exists pg_cron;
