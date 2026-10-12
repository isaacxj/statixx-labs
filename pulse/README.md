# Pulse

Uptime monitoring and client status pages for Statixx Labs. Monitors check client sites and APIs on a schedule, confirm outages before alerting, and (in later stages) publish a status page per client.

Right now the app lists the monitors stored in local D1 with their status, interval, and latest check.

## Run it

Needs Node 24 and pnpm. Run everything from this folder.

```bash
pnpm install
pnpm db:migrate   # applies migrations to local D1
pnpm db:seed      # adds sample monitors and checks
pnpm dev          # http://localhost:3000
```

Other scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Stack

Next.js (App Router) on Cloudflare Workers through vinext, Tailwind v4, Drizzle on Cloudflare D1. Everything runs against local D1 and R2 in development.
