import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { searchClients } from "@/server/db/queries";
import { ClientSheet } from "./client-sheet";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients · Ledger" };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const clients = await searchClients(q);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">People and companies you invoice.</p>
        </div>
        <ClientSheet defaults={{ id: null, name: "", company: "", email: "", address: "" }} />
      </header>
      <form role="search" className="flex max-w-md gap-2">
        <Input name="q" type="search" defaultValue={q} placeholder="Search name, company, or email" aria-label="Search clients" />
        <Button type="submit" variant="outline" size="icon" aria-label="Search"><Search /></Button>
      </form>
      {clients.length === 0 ? (
        <div className="bg-card rounded-card flex flex-col items-center gap-3 border p-10 text-center">
          <p className="font-medium">{q ? `No clients match “${q}”.` : "No clients yet."}</p>
          <p className="text-muted-foreground text-13">{q ? "Try a different name, company, or email." : "Add your first client to start invoicing."}</p>
          {q && <Button asChild variant="outline"><Link href="/clients">Clear search</Link></Button>}
        </div>
      ) : (
        <ul className="bg-card divide-border rounded-card divide-y border">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/clients/${c.id}`} className="hover:bg-accent flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors duration-150 ease-out max-md:min-h-11">
                <span className="flex flex-col">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground text-13">{c.company ?? "—"}</span>
                </span>
                <span className="text-muted-foreground font-mono text-13">{c.email ?? ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
