import { localDay } from "@/lib/entries";
import type { BillingType } from "@/server/db/schema";

export type ProfitEntry = { startedAt: string; minutes: number; billable: boolean };
export type ProfitProject = { billing: BillingType; rateCents: number; fixedFeeCents: number | null };
export type Profitability = {
  revenueCents: number;
  totalMinutes: number;
  billableMinutes: number;
  /** Revenue per hour worked across all logged time; null until time is logged or when nothing bills. */
  effectiveRateCents: number | null;
  /** Retainers only: how many calendar months had time logged. */
  months: number | null;
};

/**
 * Revenue and effective hourly rate for a project.
 * Hourly: billable hours x rate. Fixed: the fee. Retainer: the monthly fee for each Central month with time logged.
 * The rate divides by every logged minute, so non-billable time pulls it down.
 */
export function profitability(project: ProfitProject, entries: ProfitEntry[]): Profitability {
  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0);
  const billableMinutes = entries.reduce((s, e) => s + (e.billable ? e.minutes : 0), 0);
  let revenueCents = 0;
  let months: number | null = null;
  if (project.billing === "hourly") {
    revenueCents = Math.round((billableMinutes * project.rateCents) / 60);
  } else if (project.billing === "fixed") {
    revenueCents = project.fixedFeeCents ?? 0;
  } else if (project.billing === "retainer") {
    months = new Set(entries.map((e) => localDay(e.startedAt).slice(0, 7))).size;
    revenueCents = (project.fixedFeeCents ?? 0) * months;
  }
  const effectiveRateCents = totalMinutes > 0 && revenueCents > 0 ? Math.round((revenueCents * 60) / totalMinutes) : null;
  return { revenueCents, totalMinutes, billableMinutes, effectiveRateCents, months };
}
