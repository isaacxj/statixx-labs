import { listBusinesses, listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [businesses, clients] = await Promise.all([listBusinesses(), listClients()]);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Pitch</h1>
      <p className="mt-1 text-sm text-neutral-500">Proposals and quotes. Seeded rows from local D1:</p>
      <section className="mt-6">
        <h2 className="font-medium">Businesses</h2>
        <ul className="mt-2 divide-y divide-neutral-200 border border-neutral-200">
          {businesses.map((b) => (
            <li key={b.id} className="flex justify-between px-3 py-2 text-sm">
              <span>{b.name}</span>
              <span className="font-mono">{b.numberPrefix} · {b.currency}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6">
        <h2 className="font-medium">Clients</h2>
        <ul className="mt-2 divide-y divide-neutral-200 border border-neutral-200">
          {clients.map((c) => (
            <li key={c.id} className="flex justify-between px-3 py-2 text-sm">
              <span>{c.name}</span>
              <span className="text-neutral-500">{c.company}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
