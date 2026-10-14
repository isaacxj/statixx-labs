import { addDays } from "../../../src/lib/dates";
import { computeTotals, type LineInput } from "../../../src/lib/invoice-math";
import { runDates, type Schedule } from "../../../src/lib/retainer-schedule";

/** The most runs one retainer can catch up on in a single pass; the next pass picks up the rest. */
const MAX_CATCH_UP = 12;

export type RetainerRow = Schedule & { nextRunOn: string | null };

/** The run dates now due (on or before today) and the run date to store afterwards. */
export function dueRuns(r: RetainerRow, today: string): { due: string[]; nextRunOn: string | null } {
  if (!r.nextRunOn) return { due: [], nextRunOn: null };
  const due = runDates(r, MAX_CATCH_UP, r.nextRunOn).filter((d) => d <= today);
  const after = due.length ? addDays(due[due.length - 1], 1) : r.nextRunOn;
  return { due, nextRunOn: runDates(r, 1, after)[0] ?? null };
}

export type RetainerItem = LineInput & { description: string };

/** Parses `items_json`, keeping only well-formed lines. */
export function parseItems(json: string): RetainerItem[] {
  try {
    const v: unknown = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v.flatMap((i) => {
      const o = (i ?? {}) as Record<string, unknown>;
      const ok = ["qtyMilli", "unitPriceCents", "taxRateBp"].every((k) => Number.isInteger(o[k]));
      return ok && typeof o.description === "string"
        ? [{ description: o.description, qtyMilli: o.qtyMilli as number, unitPriceCents: o.unitPriceCents as number, taxRateBp: o.taxRateBp as number }]
        : [];
    });
  } catch {
    return [];
  }
}

export function invoiceFor(items: RetainerItem[], runOn: string, termsDays: number) {
  return { issueDate: runOn, dueDate: addDays(runOn, termsDays), ...computeTotals(items) };
}
