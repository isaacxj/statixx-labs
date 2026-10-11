import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BILLING_LABELS, formatDuration, formatMoney } from "@/lib/format";
import { groupUnbilled } from "@/lib/unbilled";
import { listUnbilledEntries } from "@/server/db/queries";
import { markBilled } from "./actions";

export const dynamic = "force-dynamic";

export default async function UnbilledPage() {
  const clients = groupUnbilled(await listUnbilledEntries());
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Unbilled</h1>
        <p className="text-muted-foreground">
          Billable time not yet invoiced, by client. Hourly projects are priced at hours times rate; fixed-fee and retainer time bills on the
          fee.
        </p>
      </header>
      {clients.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-card border p-6">Nothing to invoice. Everything billable has been marked billed.</p>
      ) : (
        clients.map((c) => (
          <section key={c.clientId} className="bg-card rounded-card border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">{c.name}</h2>
                <p className="text-muted-foreground font-mono text-sm tabular-nums">
                  {formatDuration(c.minutes)} h · {c.projects.some((p) => p.amountCents !== null) ? formatMoney(c.amountCents, c.currency) : "on fee"}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Button asChild variant="outline">
                  <a href={`/unbilled/export?client=${c.clientId}`} download>
                    <Download className="size-4" /> CSV
                  </a>
                </Button>
                <form action={markBilled.bind(null, c.clientId, c.maxEntryId)} className="flex items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`ref-${c.clientId}`}>Invoice ref</Label>
                    <Input id={`ref-${c.clientId}`} name="ref" placeholder="Optional" maxLength={100} className="w-36" />
                  </div>
                  <Button type="submit">Mark billed</Button>
                </form>
              </div>
            </div>
            <ul className="divide-border divide-y">
              {c.projects.map((p) => (
                <li key={p.projectId} className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 truncate font-medium">
                    {p.name} <span className="text-muted-foreground font-normal">· {BILLING_LABELS[p.billing]}</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatDuration(p.minutes)} h
                    <span className="text-muted-foreground"> · {p.amountCents === null ? "on fee" : formatMoney(p.amountCents, c.currency)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
