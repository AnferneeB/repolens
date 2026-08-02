# Repolens

> Paste a public GitHub repo → get a scrollable, shareable timeline of that repo's life.

[![Live](https://img.shields.io/badge/live-deploy%20pending-lightgrey)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<!-- After Vercel deploy: point the badge at https://repolens.vercel.app -->
![Repolens timeline](docs/screenshot.png)

## What it is

Repolens turns any public GitHub repository into a visual timeline of its life. v0.1 surfaces exactly four event types:

1. **First commit**
2. **Releases** (capped at 100)
3. **Top-contributor first commits** (top 10 contributors)
4. **Monthly commit-activity spikes**

Results are cached in Supabase so repeat views stay fast and stay within GitHub rate limits. No accounts, no private repos — just a shareable URL per repo.

## Where it's going

v0.1 is a focused first cut: one input, four event types, a shareable timeline. Longer term, Repolens could grow into a richer lens on top of GitHub — see [`docs/v2-ideas.md`](docs/v2-ideas.md) for parked ideas. Scope stays locked until this version ships.

## Try it

Once live (or locally via `bun dev`), open any public repo:

- `/vercel/next.js`
- `/facebook/react`
- `/home-assistant/core`

Paste a URL or `owner/repo` on the home page.

## Stack

- Next.js 16 (App Router) + TypeScript + Bun
- Tailwind CSS v4 + HeroUI v3
- Motion + Hugeicons (free icons — no private registry token)
- Supabase Postgres (declarative schemas)
- Octokit (GitHub REST)
- tRPC v11 + superjson
- Upstash Redis (rate limit + build lock)
- Sentry

## Local development

```bash
bun install
cp .env.example .env.local
# Add GITHUB_TOKEN (strongly recommended)

# Local Supabase (Docker required)
bun run db:start
# After schema edits: bun run db:diff -- -f <name> && bun run db:reset

bun dev
```

See [`docs/SETUP_CHECKLIST.md`](docs/SETUP_CHECKLIST.md) and [`docs/DEPLOY.md`](docs/DEPLOY.md) for GitHub PAT, Sentry, Upstash, and cloud deploy notes.

### Timeline harness

```bash
bun run timeline vercel/next.js
```

Prints a JSON timeline covering all four event types. Works without Supabase (cache is a no-op when env is unset).

## Project layout

| Path | Role |
| --- | --- |
| `lib/github.ts` | Octokit wrappers |
| `lib/repolens.ts` | `buildTimeline()` |
| `lib/cache.ts` | Supabase snapshot cache |
| `server/routers/` | tRPC routers |
| `supabase/schemas/` | Declarative DB schema (source of truth) |
| `scripts/timeline.ts` | CLI harness |
| `app/[owner]/[repo]/` | Timeline page + OG image |

## Roadmap

- **v0.1** — The Timeline (this release)
- **Later** — See [`docs/v2-ideas.md`](docs/v2-ideas.md)

## Attribution

UI scaffolding started from the [HeroUI Next.js template](https://github.com/heroui-inc/next-app-template).

## License

MIT
