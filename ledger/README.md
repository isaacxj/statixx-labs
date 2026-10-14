# Statixx Ledger

Invoices, retainers, and payments for Statixx, Aptixx, and Trazo. Next.js on Cloudflare Workers (vinext) with Tailwind v4, D1 through Drizzle, and a local database for development.

## Run it

Use Node 24 and pnpm. From this folder:

```bash
pnpm install
pnpm db:migrate   # applies migrations to the local D1 database
pnpm db:seed      # adds two businesses and three clients
pnpm dev          # http://localhost:3000
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Database commands only ever touch the local D1 database. After editing `src/server/db/schema.ts`, run `pnpm db:generate` and then `pnpm db:migrate`.

## Design system and shell

Tokens (OKLCH, light and dark) live in `src/app/globals.css`; `/design` shows every token and base component. Theme is light, dark, or system and is remembered. The signed-in email comes from the Cloudflare Access header; set `DEV_USER_EMAIL` in a local `.dev.vars` file to see initials in development.

## Jobs Worker

`workers/jobs/` is a separate Worker with a daily Cron Trigger. It creates the invoice for every retainer run that has come due (already marked sent, with a share link), and marks sent, viewed, and partially paid invoices past their due date as overdue. It is safe to run twice: each retainer run is unique by retainer and issue date.

Try it locally against the same local D1 database the app uses:

```bash
pnpm db:migrate
pnpm jobs:dev
curl "http://localhost:8788/__scheduled?cron=0+12+*+*+*"
```

### Morning digest

After the daily jobs, the Worker emails the digest recipient (set in Settings) the overdue invoices, invoices due in the next 7 days, and retainer invoices created in the last day. `/digest` previews it. The Worker sends through the `EMAIL` Email Routing binding from `DIGEST_FROM` (a placeholder in `workers/jobs/wrangler.jsonc` until the sending domain is set up); locally, wrangler writes each email to `workers/jobs/.wrangler/tmp/email/` instead of sending. `pnpm db:seed` adds sample invoices and a recipient so the digest has content.
