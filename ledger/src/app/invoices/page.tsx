import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { listInvoices } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices · Ledger" };

export default async function InvoicesPage() {
  const invoices = await listInvoices();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Everything you have billed.</p>
        </div>
        <Button asChild><Link href="/invoices/new"><Plus />New invoice</Link></Button>
      </header>
      {invoices.length === 0 ? (
        <div className="bg-card rounded-card flex flex-col items-center gap-3 border p-10 text-center">
          <p className="font-medium">No invoices yet.</p>
          <p className="text-muted-foreground text-13">Create your first invoice and see it take shape as you type.</p>
          <Button asChild variant="outline"><Link href="/invoices/new">New invoice</Link></Button>
        </div>
      ) : (
        <ul className="bg-card divide-border rounded-card divide-y border">
          {invoices.map((i) => (
            <li key={i.id}>
              <Link href={`/invoices/${i.id}`} className="hover:bg-accent flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors duration-150 ease-out max-md:min-h-11">
                <span className="flex flex-col">
                  <span className="font-mono font-medium">{i.number}</span>
                  <span className="text-muted-foreground text-13">{i.clientName} · {i.businessName}</span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="text-muted-foreground font-mono text-13">Due {formatDate(i.dueDate)}</span>
                  <span className="font-mono tabular-nums">{formatMoney(i.totalCents, i.currency)}</span>
                  <Badge tone={i.status === "draft" ? "neutral" : "info"} className="capitalize">{i.status.replace("_", " ")}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
