CREATE TABLE public.repo_snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  owner text NOT NULL,
  repo text NOT NULL,
  schema_version integer DEFAULT 1 NOT NULL,
  fetched_at timestamp with time zone DEFAULT now() NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT repo_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT repo_snapshots_owner_repo_key UNIQUE (owner, repo)
);

COMMENT ON TABLE public.repo_snapshots IS 'Cached Repolens timeline payloads keyed by owner/repo (24h TTL enforced in app).';

CREATE INDEX repo_snapshots_fetched_at_idx ON public.repo_snapshots (fetched_at DESC);

REVOKE ALL ON TABLE public.repo_snapshots FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.repo_snapshots TO service_role;
