import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const clients = await listClients(q);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link href="/clients/new" className={buttonVariants()}><Plus />New client</Link>
      </div>
      <form role="search" className="relative max-w-sm">
        <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input name="q" type="search" defaultValue={q} placeholder="Search name, company or email" aria-label="Search clients" className="pl-9" />
      </form>
      {clients.length === 0 ? (
        <div className="bg-card flex flex-col items-start gap-3 rounded-md border p-6">
          <p className="font-medium">{q ? `No clients match “${q}”.` : "No clients yet."}</p>
          <Link href={q ? "/clients" : "/clients/new"} className={buttonVariants({ variant: "outline" })}>
            {q ? "Clear search" : "Add your first client"}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-left">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="font-medium underline-offset-4 hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.company}</td>
                  <td className="tabular px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="tabular px-4 py-3 text-muted-foreground">{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
