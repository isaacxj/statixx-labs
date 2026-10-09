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
