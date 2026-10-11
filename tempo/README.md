# Tempo

Time tracking and project profitability for Statixx, Aptixx, and Trazo: timers and timesheets against clients and projects, budget burn, effective hourly rate, and billable-time export.

Next.js (App Router) on Cloudflare Workers through vinext, Tailwind v4, Drizzle on Cloudflare D1. Everything runs locally against a local D1 database.

## Run it

Requires Node 24 and pnpm.

```bash
pnpm install
pnpm db:migrate   # apply migrations to local D1
pnpm db:seed      # seed businesses, clients, and projects
pnpm dev          # http://localhost:3000
```

## Scripts

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- `pnpm db:generate` creates a migration after a schema change in `src/server/db/schema.ts`

## Layout

- `src/server/db`: schema, `getDb()`, and the query functions pages call
- `src/lib`: pure helpers (formatting, and later rounding and budgets)
- `scripts/seed.ts`: local seed data
