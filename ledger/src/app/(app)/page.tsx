import { formatRate } from "@/lib/money";
import { listBusinesses, listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [businesses, clients] = await Promise.all([listBusinesses(), listClients()]);
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Invoices, retainers, and payments.</p>
      </header>
      <section aria-labelledby="biz-h" className="flex flex-col gap-3">
        <h2 id="biz-h" className="text-base font-semibold">Businesses</h2>
        <ul className="bg-card divide-border rounded-card divide-y border">
          {businesses.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
              <span className="font-medium">{b.name}</span>
              <span className="text-muted-foreground font-mono text-13">
                {b.numberPrefix} · {b.currency} · tax {formatRate(b.taxRateBp)} · net {b.termsDays}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="client-h" className="flex flex-col gap-3">
        <h2 id="client-h" className="text-base font-semibold">Clients</h2>
        <ul className="bg-card divide-border rounded-card divide-y border">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground">{c.company ?? "—"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
