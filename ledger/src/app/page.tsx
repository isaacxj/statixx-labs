import { formatRate } from "@/lib/money";
import { listBusinesses, listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [businesses, clients] = await Promise.all([listBusinesses(), listClients()]);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Ledger</h1>
        <p className="text-muted-foreground">Invoices, retainers, and payments.</p>
      </header>
      <section aria-labelledby="biz-h" className="flex flex-col gap-3">
        <h2 id="biz-h" className="text-base font-semibold">Businesses</h2>
        <ul className="bg-card divide-border border-border divide-y rounded-md border">
          {businesses.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-medium">{b.name}</span>
              <span className="text-muted-foreground">
                {b.numberPrefix} · {b.currency} · tax {formatRate(b.taxRateBp)} · net {b.termsDays}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="client-h" className="flex flex-col gap-3">
        <h2 id="client-h" className="text-base font-semibold">Clients</h2>
        <ul className="bg-card divide-border border-border divide-y rounded-md border">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground">{c.company ?? "—"}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
