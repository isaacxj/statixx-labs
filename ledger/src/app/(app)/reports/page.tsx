import Link from "next/link";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { todayChicago } from "@/lib/dates";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { buildReports, parseYear, reportYears, type Slice } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { getReportInvoices } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports · Ledger" };

function Bars({ title, slices, currency, hideEmpty }: { title: string; slices: Slice[]; currency: CurrencyCode; hideEmpty?: boolean }) {
  const rows = hideEmpty ? slices.filter((s) => s.count > 0) : slices;
  const max = Math.max(...rows.map((s) => s.totalCents), 1);
  return (
    <section className="bg-card rounded-card flex flex-col gap-4 border p-4">
      <h3 className="text-16 font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-13">Nothing invoiced yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((s) => (
            <li key={s.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 max-sm:grid-cols-[5rem_1fr_auto]">
              <span className="text-13 truncate" title={s.label}>{s.label}</span>
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2 w-full" role="img" aria-label={`${s.label}: ${formatMoney(s.totalCents, currency)}`}>
                <rect width="100" height="8" rx="2" className="fill-muted" />
                {s.totalCents > 0 && <rect width={Math.max((s.totalCents / max) * 100, 2)} height="8" rx="2" className="text-primary fill-current" />}
              </svg>
              <span className="font-mono text-13 tabular-nums">{formatMoney(s.totalCents, currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const params = await searchParams;
  const currentYear = Number(todayChicago().slice(0, 4));
  const year = parseYear(params.year, currentYear);
  const invoices = await getReportInvoices();
  const reports = buildReports(invoices, year);
  const years = reportYears(invoices.map((i) => i.issueDate), currentYear);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Revenue is the total of invoices issued in {year}, not counting drafts or voided invoices.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/reports/invoices.csv" download className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <Download /> Invoices CSV
          </a>
          <a href="/reports/payments.csv" download className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <Download /> Payments CSV
          </a>
        </div>
      </header>
      <nav aria-label="Year" className="flex flex-wrap gap-1">
        {years.map((y) => (
          <Link
            key={y}
            href={`/reports?year=${y}`}
            aria-current={y === year ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: y === year ? "secondary" : "ghost", size: "sm" }),
              "font-mono tabular-nums",
            )}
          >
            {y}
          </Link>
        ))}
      </nav>
      {reports.length === 0 ? (
        <p className="bg-card rounded-card text-muted-foreground text-13 border p-4">
          No invoices were issued in {year}. Send an invoice and its revenue shows up here by month, client, and business.
        </p>
      ) : (
        reports.map((r) => (
          <div key={r.currency} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <h2 className="text-20 font-semibold font-mono">{r.currency}</h2>
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-13">
                <div className="flex gap-2"><dt className="text-muted-foreground">Revenue</dt><dd className="font-mono tabular-nums">{formatMoney(r.totalCents, r.currency)}</dd></div>
                <div className="flex gap-2"><dt className="text-muted-foreground">Tax charged</dt><dd className="font-mono tabular-nums">{formatMoney(r.taxCents, r.currency)}</dd></div>
                <div className="flex gap-2"><dt className="text-muted-foreground">Invoices</dt><dd className="font-mono tabular-nums">{r.count}</dd></div>
              </dl>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Bars title="By month" slices={r.months} currency={r.currency} />
              <div className="flex flex-col gap-4">
                <Bars title="By client" slices={r.clients} currency={r.currency} />
                <Bars title="By business" slices={r.businesses} currency={r.currency} />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
