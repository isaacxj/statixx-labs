import { listBusinesses, listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [businesses, clients] = await Promise.all([listBusinesses(), listClients()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-muted-foreground">Business profiles and clients from local D1.</p>
      </div>
      <section aria-labelledby="biz" className="rounded-md border bg-card">
        <h2 id="biz" className="border-b px-4 py-3 text-lg font-medium">Businesses</h2>
        <ul className="divide-y">
          {businesses.map((b) => (
            <li key={b.id} className="flex items-center justify-between px-4 py-3">
              <span>{b.name}</span>
              <span className="tabular text-muted-foreground">{b.numberPrefix} · {b.currency}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="cl" className="rounded-md border bg-card">
        <h2 id="cl" className="border-b px-4 py-3 text-lg font-medium">Clients</h2>
        <ul className="divide-y">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <span>{c.name}</span>
              <span className="text-muted-foreground">{c.company}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
