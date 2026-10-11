import { centralToUtc, localDay } from "@/lib/entries";
import { addDays } from "@/lib/timesheet";
import { parseRange } from "@/lib/reports";
import { listReportEntries } from "@/server/db/queries";

/** Entries for the Central-day range in the query params, plus the resolved range. */
export async function loadReport(from: string | undefined, to: string | undefined) {
  const range = parseRange(from, to, localDay(new Date().toISOString()));
  const entries = await listReportEntries(centralToUtc(range.from, "00:00"), centralToUtc(addDays(range.to, 1), "00:00"));
  return { range, entries };
}
