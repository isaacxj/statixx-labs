# Portal

A private portal for each client: project status, milestones, updates, shared files, approvals, and requests in one place instead of scattered email threads.

Next.js (App Router, TypeScript) on Cloudflare Workers through vinext, with Tailwind v4, Cloudflare D1 through Drizzle, and an R2 binding for files. Sign-in is handled by Cloudflare Access in front of the app, so the app has no login code.

## Run it

Requires Node 24 and pnpm.

```bash
pnpm install
pnpm db:migrate   # applies migrations to the local D1 database
pnpm db:seed      # adds sample clients, client users, and projects
pnpm dev          # http://localhost:3000
```

Locally, the signed-in email comes from `DEV_USER_EMAIL` in `wrangler.jsonc`, and `TEAM_EMAILS` lists who counts as team.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the app against local D1 and R2 |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generate route types, then `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm db:generate` | Generate a Drizzle migration from `src/server/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations to local D1 |
| `pnpm db:seed` | Reset and seed local D1 |

## Daily digest job

`workers/jobs/` is a separate Worker (`portal-jobs`) bound to the same D1 database. A daily Cron Trigger (13:00 UTC) builds the team digest and emails it to every address in `TEAM_EMAILS` through the `DIGEST_EMAIL` send_email binding; nothing is sent when there is nothing new. To try it locally, run `pnpm db:migrate && pnpm db:seed`, then `pnpm jobs:dev` and `curl http://localhost:8788/cdn-cgi/handler/scheduled`. Wrangler prints the path of the `.eml` file it wrote.
