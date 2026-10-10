import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { parseTab, STATUS_TABS, statusLabel, statusTone, TAB_LABELS, tabStatuses } from "@/lib/invoice-status";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { countInvoicesByStatus, listInvoices } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices · Ledger" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams;
  const tab = parseTab(params.status);
  const q = params.q ?? "";
  const [invoices, counts] = await Promise.all([listInvoices({ tab, q }), countInvoicesByStatus()]);
  const tabCount = (t: (typeof STATUS_TABS)[number]) =>
    (tabStatuses(t) ?? Object.keys(counts)).reduce((n, s) => n + (counts[s as keyof typeof counts] ?? 0), 0);
  const href = (t: string) => {
    const sp = new URLSearchParams();
    if (t !== "all") sp.set("status", t);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/invoices?${qs}` : "/invoices";
  };
  const filtered = tab !== "all" || q !== "";
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Everything you have billed.</p>
        </div>
        <Button asChild><Link href="/invoices/new"><Plus />New invoice</Link></Button>
      </header>
      <nav aria-label="Invoice status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {STATUS_TABS.map((t) => (
          <Link
            key={t}
            href={href(t)}
            aria-current={t === tab ? "page" : undefined}
            className={cn(
              "text-13 inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 whitespace-nowrap transition-colors duration-150 ease-out max-md:min-h-11",
              t === tab ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {TAB_LABELS[t]}
            <span className="text-muted-foreground font-mono tabular-nums">{tabCount(t)}</span>
          </Link>
        ))}
      </nav>
      <form role="search" className="flex max-w-md gap-2">
        {tab !== "all" && <input type="hidden" name="status" value={tab} />}
        <Input name="q" type="search" defaultValue={q} placeholder="Search number, client, or business" aria-label="Search invoices" />
        <Button type="submit" variant="outline" size="icon" aria-label="Search"><Search /></Button>
      </form>
      {invoices.length === 0 ? (
        <div className="bg-card rounded-card flex flex-col items-center gap-3 border p-10 text-center">
          <p className="font-medium">{filtered ? "No invoices match." : "No invoices yet."}</p>
          <p className="text-muted-foreground text-13">
            {filtered ? "Try another status or search term." : "Create your first invoice and see it take shape as you type."}
          </p>
          {filtered ? (
            <Button asChild variant="outline"><Link href="/invoices">Clear filters</Link></Button>
          ) : (
            <Button asChild variant="outline"><Link href="/invoices/new">New invoice</Link></Button>
          )}
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
                  <Badge tone={statusTone(i.status)} className="capitalize">{statusLabel(i.status)}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
