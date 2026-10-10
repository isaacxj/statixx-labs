import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { computeTotals } from "@/lib/invoice-math";
import { formatMoney } from "@/lib/money";
import { cadenceLabel } from "@/lib/retainer-schedule";
import type { RetainerItem } from "@/lib/retainer-form";
import { listRetainers } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Retainers · Ledger" };

export default async function RetainersPage() {
  const retainers = await listRetainers();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Retainers</h1>
          <p className="text-muted-foreground">Recurring invoices that go out on a schedule.</p>
        </div>
        <Button asChild><Link href="/retainers/new"><Plus />New retainer</Link></Button>
      </header>
      {retainers.length === 0 ? (
        <div className="bg-card rounded-card flex flex-col items-center gap-3 border p-10 text-center">
          <p className="font-medium">No retainers yet.</p>
          <p className="text-muted-foreground text-13">Set one up and its invoices are created each period.</p>
          <Button asChild variant="outline"><Link href="/retainers/new">New retainer</Link></Button>
        </div>
      ) : (
        <ul className="bg-card divide-border rounded-card divide-y border">
          {retainers.map((r) => {
            const total = computeTotals(JSON.parse(r.itemsJson) as RetainerItem[]).totalCents;
            return (
              <li key={r.id}>
                <Link href={`/retainers/${r.id}`} className="hover:bg-accent flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors duration-150 ease-out max-md:min-h-11">
                  <span className="flex flex-col">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-muted-foreground text-13">{r.clientName} · {r.businessName} · {cadenceLabel(r.cadence)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="flex flex-col items-end">
                      <span className="font-mono text-13 tabular-nums">{formatMoney(total, r.currency)}</span>
                      <span className="text-muted-foreground font-mono text-13">{r.active && r.nextRunOn ? `Next ${formatDate(r.nextRunOn)}` : "—"}</span>
                    </span>
                    <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Active" : "Paused"}</Badge>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
