import { addDays } from "./dates";
import { formatMoney, type CurrencyCode } from "./money";
import { computeTotals } from "./invoice-math";
import type { RetainerItem } from "./retainer-form";

export const AGING_BUCKETS = ["current", "d1_30", "d31_60", "d60_plus"] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

export const AGING_LABELS: Record<AgingBucket, string> = {
  current: "Current",
  d1_30: "1–30 days",
  d31_60: "31–60 days",
  d60_plus: "60+ days",
};

export type OpenInvoice = { currency: CurrencyCode; dueDate: string; balanceCents: number };
export type CurrencyAmounts = Partial<Record<CurrencyCode, number>>;

/** Where an unpaid invoice sits by how long past its due date it is on `today`. */
export function agingBucket(dueDate: string, today: string): AgingBucket {
  if (dueDate >= today) return "current";
  if (dueDate >= addDays(today, -30)) return "d1_30";
  if (dueDate >= addDays(today, -60)) return "d31_60";
  return "d60_plus";
}

export type Aging = Record<AgingBucket, number>;

const emptyAging = (): Aging => ({ current: 0, d1_30: 0, d31_60: 0, d60_plus: 0 });

/** Outstanding and overdue totals plus the aging buckets, one set per currency. */
export function summarizeOpen(invoices: OpenInvoice[], today: string) {
  const outstanding: CurrencyAmounts = {};
  const overdue: CurrencyAmounts = {};
  const aging: Partial<Record<CurrencyCode, Aging>> = {};
  for (const i of invoices) {
    outstanding[i.currency] = (outstanding[i.currency] ?? 0) + i.balanceCents;
    const bucket = agingBucket(i.dueDate, today);
    if (bucket !== "current") overdue[i.currency] = (overdue[i.currency] ?? 0) + i.balanceCents;
    const a = (aging[i.currency] ??= emptyAging());
    a[bucket] += i.balanceCents;
  }
  return { outstanding, overdue, aging };
}

export type RetainerRow = { cadence: "monthly" | "quarterly"; currency: CurrencyCode; itemsJson: string };

/** What active retainers bill per month, with quarterly ones spread over three months. */
export function monthlyRetainerRevenue(rows: RetainerRow[]): CurrencyAmounts {
  const out: CurrencyAmounts = {};
  for (const r of rows) {
    const total = computeTotals(JSON.parse(r.itemsJson) as RetainerItem[]).totalCents;
    const monthly = r.cadence === "quarterly" ? Math.round(total / 3) : total;
    out[r.currency] = (out[r.currency] ?? 0) + monthly;
  }
  return out;
}

/** "$1,200.00", or "$1,200.00 + CA$300.00" when more than one currency is present. */
export function amountsLabel(amounts: CurrencyAmounts): string {
  const parts = (Object.entries(amounts) as [CurrencyCode, number][])
    .filter(([, cents]) => cents !== 0)
    .map(([c, cents]) => formatMoney(cents, c));
  return parts.length ? parts.join(" + ") : formatMoney(0);
}

export const monthStart = (today: string) => `${today.slice(0, 7)}-01`;
