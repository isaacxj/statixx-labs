import { BILLING_LABELS, formatDuration, formatMoney } from "@/lib/format";
import type { Profitability } from "@/lib/profit";
import type { BillingType } from "@/server/db/schema";

export function ProfitCard({ billing, currency, profit }: { billing: BillingType; currency: string; profit: Profitability }) {
  const stat = (label: string, value: string) => (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
  return (
    <section aria-labelledby="profit" className="bg-card rounded-card flex flex-col gap-4 border p-4">
      <h2 id="profit" className="text-base font-semibold">
        Profitability
      </h2>
      {billing === "non_billable" ? (
        <p className="text-muted-foreground text-sm">Non-billable project: {formatDuration(profit.totalMinutes)}h logged, no revenue.</p>
      ) : profit.totalMinutes === 0 ? (
        <p className="text-muted-foreground text-sm">Log time on this project to see its effective hourly rate.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stat("Effective rate", profit.effectiveRateCents === null ? "n/a" : `${formatMoney(profit.effectiveRateCents, currency)}/h`)}
            {stat("Revenue", formatMoney(profit.revenueCents, currency))}
            {stat("Hours logged", formatDuration(profit.totalMinutes))}
            {stat("Billable hours", formatDuration(profit.billableMinutes))}
          </dl>
          <p className="text-muted-foreground text-xs">
            {BILLING_LABELS[billing]}:{" "}
            {billing === "hourly" && "billable hours times the rate, divided by all hours logged."}
            {billing === "fixed" && "the fixed fee divided by all hours logged."}
            {billing === "retainer" && `the monthly fee for each of ${profit.months} month${profit.months === 1 ? "" : "s"} with time logged, divided by all hours logged.`}
          </p>
        </>
      )}
    </section>
  );
}
