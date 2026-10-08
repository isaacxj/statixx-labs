# Statixx Pitch

Proposals and quotes for Statixx, Aptixx, and Trazo: reusable sections and price tables, a private client link, view tracking, and accept or decline.

Next.js (App Router) on Cloudflare Workers through vinext, Tailwind v4, Drizzle on Cloudflare D1.

## Run it

Requires Node 24 and pnpm. Run everything from this folder.

```bash
pnpm install
pnpm db:migrate   # applies migrations to the local D1 database
pnpm db:seed      # loads sample businesses and clients
pnpm dev          # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server on Workers runtime with local D1 |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Route types plus `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm db:generate` | Generate a Drizzle migration from `src/server/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations to local D1 |
| `pnpm db:seed` | Reset and seed local D1 |
