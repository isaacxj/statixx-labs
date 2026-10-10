import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AGING_BUCKETS, AGING_LABELS, amountsLabel, type Aging, type AgingBucket, type CurrencyAmounts } from "@/lib/dashboard";
import { formatDate } from "@/lib/dates";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { getDashboardData } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Ledger" };

const BAR_TONE: Record<AgingBucket, string> = {
  current: "text-success",
  d1_30: "text-warning",
  d31_60: "text-danger",
  d60_plus: "text-danger",
};

function Kpi({ label, amounts, tone }: { label: string; amounts: CurrencyAmounts; tone?: "danger" }) {
  return (
    <div className="bg-card rounded-card flex flex-col gap-1 border p-4">
      <dt className="text-muted-foreground text-13">{label}</dt>
      <dd className={`font-mono text-20 font-semibold tabular-nums ${tone === "danger" ? "text-danger" : ""}`}>{amountsLabel(amounts)}</dd>
    </div>
  );
}

function AgingChart({ currency, aging }: { currency: CurrencyCode; aging: Aging }) {
  const max = Math.max(...AGING_BUCKETS.map((b) => aging[b]), 1);
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-muted-foreground font-mono text-13">{currency}</h3>
      <ul className="flex flex-col gap-3">
        {AGING_BUCKETS.map((b) => (
          <li key={b} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 max-sm:grid-cols-[5.5rem_1fr_auto]">
            <span className="text-13">{AGING_LABELS[b]}</span>
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2 w-full" role="img" aria-label={`${AGING_LABELS[b]}: ${formatMoney(aging[b], currency)}`}>
              <rect width="100" height="8" rx="2" className="fill-muted" />
              {aging[b] > 0 && <rect width={Math.max((aging[b] / max) * 100, 2)} height="8" rx="2" className={`fill-current ${BAR_TONE[b]}`} />}
            </svg>
            <span className="font-mono text-13 tabular-nums">{formatMoney(aging[b], currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-card flex flex-col gap-4 border p-4">
      <h2 className="text-16 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const d = await getDashboardData();
  const currencies = Object.keys(d.aging) as CurrencyCode[];
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Invoices, retainers, and payments as of {formatDate(d.today)}.</p>
      </header>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Outstanding" amounts={d.outstanding} />
        <Kpi label="Overdue" amounts={d.overdue} tone="danger" />
        <Kpi label="Paid this month" amounts={d.paidThisMonth} />
        <Kpi label="Monthly retainer revenue" amounts={d.monthlyRetainers} />
      </dl>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Aging">
          {currencies.length === 0 ? (
            <p className="text-muted-foreground text-13">Nothing outstanding. Sent invoices that are unpaid show up here by how late they are.</p>
          ) : (
            currencies.map((c) => <AgingChart key={c} currency={c} aging={d.aging[c]!} />)
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <Card title="Upcoming retainer runs">
            {d.upcomingRuns.length === 0 ? (
              <p className="text-muted-foreground text-13">
                No active retainers. <Link href="/retainers" className="text-primary underline-offset-4 hover:underline">Set one up</Link>
              </p>
            ) : (
              <ul className="divide-border -my-2 divide-y">
                {d.upcomingRuns.map((r) => (
                  <li key={r.id}>
                    <Link href={`/retainers/${r.id}`} className="hover:bg-accent -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors duration-150 ease-out max-md:min-h-11">
                      <span className="flex flex-col">
                        <span className="text-14 font-medium">{r.title}</span>
                        <span className="text-muted-foreground text-13">{r.clientName}</span>
                      </span>
                      <span className="flex flex-col items-end">
                        <span className="font-mono text-13 tabular-nums">{formatMoney(r.totalCents, r.currency)}</span>
                        <span className="text-muted-foreground font-mono text-13">{formatDate(r.nextRunOn)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Recent payments">
            {d.recentPayments.length === 0 ? (
              <p className="text-muted-foreground text-13">No payments yet. Record one from a sent invoice.</p>
            ) : (
              <ul className="divide-border -my-2 divide-y">
                {d.recentPayments.map((p) => (
                  <li key={p.id}>
                    <Link href={`/invoices/${p.invoiceId}`} className="hover:bg-accent -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors duration-150 ease-out max-md:min-h-11">
                      <span className="flex flex-col">
                        <span className="font-mono text-13">{p.number}</span>
                        <span className="text-muted-foreground text-13">{p.clientName}</span>
                      </span>
                      <span className="flex flex-col items-end">
                        <Badge tone="success" className="font-mono tabular-nums">{formatMoney(p.amountCents, p.currency)}</Badge>
                        <span className="text-muted-foreground font-mono text-13">{formatDate(p.paidOn)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
