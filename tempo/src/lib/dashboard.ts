import { localDay } from "@/lib/entries";
import { weekDays } from "@/lib/timesheet";
import type { ReportEntry } from "@/lib/reports";

export type DashboardProject = { projectId: number; label: string; minutes: number };
export type Dashboard = {
  totalMinutes: number;
  billableMinutes: number;
  /** Whole percent of logged time that is billable; 0 when nothing is logged. */
  billableShare: number;
  byProject: DashboardProject[];
  /** One point per day of the week, in order. */
  daily: { day: string; minutes: number }[];
};

/** This week's numbers from finished entries already limited to the week starting `start`. */
export function buildDashboard(entries: ReportEntry[], start: string): Dashboard {
  const days = weekDays(start);
  const perDay = new Map(days.map((d) => [d, 0]));
  const projects = new Map<number, DashboardProject>();
  let total = 0;
  let billable = 0;
  for (const e of entries) {
    const day = localDay(e.startedAt);
    if (!perDay.has(day)) continue;
    perDay.set(day, perDay.get(day)! + e.minutes);
    total += e.minutes;
    if (e.billable) billable += e.minutes;
    const p = projects.get(e.projectId) ?? { projectId: e.projectId, label: `${e.clientName} · ${e.projectName}`, minutes: 0 };
    p.minutes += e.minutes;
    projects.set(e.projectId, p);
  }
  return {
    totalMinutes: total,
    billableMinutes: billable,
    billableShare: total ? Math.round((billable / total) * 100) : 0,
    byProject: [...projects.values()].sort((a, b) => b.minutes - a.minutes || a.label.localeCompare(b.label)),
    daily: days.map((d) => ({ day: d, minutes: perDay.get(d)! })),
  };
}

