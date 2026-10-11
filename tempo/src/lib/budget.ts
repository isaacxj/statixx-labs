import { localDay } from "@/lib/entries";
import { addDays } from "@/lib/timesheet";

export type BudgetLevel = "ok" | "warning" | "over";
export type BudgetStatus = { usedMinutes: number; budgetMinutes: number; percent: number; level: BudgetLevel };

/** Budget burn: warning from 80% of the budget, over at 100%. Null when the project has no budget. */
export function budgetStatus(usedMinutes: number, budgetMinutes: number | null): BudgetStatus | null {
  if (budgetMinutes === null || budgetMinutes <= 0) return null;
  const percent = Math.round((usedMinutes / budgetMinutes) * 100);
  const level: BudgetLevel = usedMinutes >= budgetMinutes ? "over" : usedMinutes >= budgetMinutes * 0.8 ? "warning" : "ok";
  return { usedMinutes, budgetMinutes, percent, level };
}

export type BurnPoint = { day: string; minutes: number };

/** Cumulative minutes per Central day, from the first entry's day through `today` (one point per day). */
export function burnSeries(entries: { startedAt: string; minutes: number }[], today: string): BurnPoint[] {
  if (entries.length === 0) return [];
  const perDay = new Map<string, number>();
  for (const e of entries) {
    const d = localDay(e.startedAt);
    perDay.set(d, (perDay.get(d) ?? 0) + e.minutes);
  }
  const days = [...perDay.keys()].sort();
  const last = days[days.length - 1] > today ? days[days.length - 1] : today;
  const points: BurnPoint[] = [];
  let total = 0;
  for (let d = days[0]; d <= last; d = addDays(d, 1)) {
    total += perDay.get(d) ?? 0;
    points.push({ day: d, minutes: total });
  }
  return points;
}
