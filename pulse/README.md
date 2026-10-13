# Pulse

Uptime monitoring and client status pages for Statixx Labs. Monitors check client sites and APIs on a schedule, confirm outages before alerting, and (in later stages) publish a status page per client.

The app lists the monitors stored in local D1 with their status, interval, and latest check, and lets you add, edit, pause and delete them. A separate checker Worker (`workers/checker/`) runs due checks on a one-minute cron and records each result.

## Run it

Needs Node 24 and pnpm. Run everything from this folder.

```bash
pnpm install
pnpm db:migrate   # applies migrations to local D1
pnpm db:seed      # adds sample monitors and checks
pnpm dev          # http://localhost:3000
```

Run the checker locally (separate terminals, same folder):

```bash
pnpm checker:serve   # test target on :4000 (/ok, /fail, /slow)
pnpm checker:dev     # checker Worker with the scheduled trigger enabled
curl "http://localhost:8788/cdn-cgi/handler/scheduled"   # run due checks now
```

Add monitors pointing at `http://localhost:4000/ok` or `/fail` in the app, then trigger the checker; results show as each monitor's latest check.

Other scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Stack

Next.js (App Router) on Cloudflare Workers through vinext, Tailwind v4, Drizzle on Cloudflare D1. Everything runs against local D1 and R2 in development.
