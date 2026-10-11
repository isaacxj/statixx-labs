import { localDay } from "@/lib/entries";
import { addDays, weekStart } from "@/lib/timesheet";

export type ReportEntry = {
  startedAt: string;
  minutes: number;
  billable: boolean;
  projectId: number;
  projectName: string;
  clientName: string;
  description: string;
};

export type Group = { key: string; label: string; minutes: number; billableMinutes: number };
export type Report = {
  totalMinutes: number;
  billableMinutes: number;
  byClient: Group[];
  byProject: Group[];
  byWeek: Group[];
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A valid inclusive Central-day range from query params, defaulting to the last 30 days ending `today`. */
export function parseRange(from: string | undefined, to: string | undefined, today: string): { from: string; to: string } {
  const end = to && DAY.test(to) ? to : today;
  const start = from && DAY.test(from) ? from : addDays(end, -29);
  return start <= end ? { from: start, to: end } : { from: end, to: start };
}

function add(map: Map<string, Group>, key: string, label: string, e: ReportEntry) {
  const g = map.get(key) ?? { key, label, minutes: 0, billableMinutes: 0 };
  g.minutes += e.minutes;
  if (e.billable) g.billableMinutes += e.minutes;
  map.set(key, g);
}

const byMinutes = (a: Group, b: Group) => b.minutes - a.minutes || a.label.localeCompare(b.label);

/** Hours by client, project, and Monday-started week for entries already limited to the range. */
export function buildReport(entries: ReportEntry[]): Report {
  const clients = new Map<string, Group>();
  const projects = new Map<string, Group>();
  const weeks = new Map<string, Group>();
  for (const e of entries) {
    add(clients, e.clientName, e.clientName, e);
    add(projects, String(e.projectId), `${e.clientName} · ${e.projectName}`, e);
    const wk = weekStart(localDay(e.startedAt));
    add(weeks, wk, wk, e);
  }
  return {
    totalMinutes: entries.reduce((s, e) => s + e.minutes, 0),
    billableMinutes: entries.reduce((s, e) => s + (e.billable ? e.minutes : 0), 0),
    byClient: [...clients.values()].sort(byMinutes),
    byProject: [...projects.values()].sort(byMinutes),
    byWeek: [...weeks.values()].sort((a, b) => a.key.localeCompare(b.key)),
  };
}

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** One row per entry, with hours as a decimal, so the file's total equals the report's. */
export function entriesCsv(entries: ReportEntry[]): string {
  const rows = [["Date", "Client", "Project", "Description", "Hours", "Billable"]];
  for (const e of entries) {
    rows.push([localDay(e.startedAt), e.clientName, e.projectName, e.description, (e.minutes / 60).toFixed(2), e.billable ? "yes" : "no"]);
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
