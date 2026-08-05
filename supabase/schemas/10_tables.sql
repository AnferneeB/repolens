-- Declarative source of truth for repo_snapshots.
-- Generate migrations with: supabase db diff -f <name>
-- Never hand-edit supabase/migrations/ for schema changes (except reviewing generated output).

create table if not exists public.repo_snapshots (
  id bigint generated always as identity primary key,
  owner text not null,
  repo text not null,
  schema_version integer not null default 1,
  fetched_at timestamptz not null default now(),
  data jsonb not null,
  created_at timestamptz not null default now(),
  constraint repo_snapshots_owner_repo_key unique (owner, repo)
);

create index if not exists repo_snapshots_fetched_at_idx
  on public.repo_snapshots (fetched_at desc);

comment on table public.repo_snapshots is
  'Cached Repolens timeline payloads keyed by owner/repo (24h TTL enforced in app).';

-- App uses the service role only. No public/anon access.
-- RLS enabled with no policies: anon/authenticated get zero rows even if a
-- grant is ever re-added. service_role bypasses RLS.
alter table public.repo_snapshots enable row level security;
revoke all on table public.repo_snapshots from anon, authenticated;
grant select, insert, update, delete on table public.repo_snapshots to service_role;
