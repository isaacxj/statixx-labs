import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getClient } from "@/server/db/queries";
import { ClientSheet } from "../client-sheet";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client · Ledger" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = /^\d+$/.test(id) ? await getClient(Number(id)) : null;
  if (!client) notFound();
  const rows: [string, string | null][] = [
    ["Company", client.company],
    ["Email", client.email],
    ["Address", client.address],
  ];
  return (
    <div className="flex flex-col gap-6">
      <Link href="/clients" className="text-muted-foreground hover:text-foreground text-13 inline-flex w-fit items-center gap-1">
        <ChevronLeft className="size-4" />Clients
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
        <ClientSheet
          variant="outline"
          defaults={{ id: client.id, name: client.name, company: client.company ?? "", email: client.email ?? "", address: client.address ?? "" }}
        />
      </header>
      <dl className="bg-card rounded-card divide-border max-w-2xl divide-y border">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted-foreground text-13">{label}</dt>
            <dd className="whitespace-pre-line">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="inv-h" className="flex flex-col gap-3">
        <h2 id="inv-h" className="text-base font-semibold">Invoices</h2>
        <div className="bg-card rounded-card text-muted-foreground border p-6 text-center text-13">No invoices for this client yet.</div>
      </section>
    </div>
  );
}
