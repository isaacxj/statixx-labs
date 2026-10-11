import { centralToUtc } from "@/lib/entries";

export type ImportRow = {
  client: string;
  project: string;
  description: string;
  /** Central wall-clock day (YYYY-MM-DD) and start time (HH:MM). */
  day: string;
  time: string;
  minutes: number;
  billable: boolean;
};

export type ParsedImport = { source: "Toggl" | "Clockify"; rows: ImportRow[]; skipped: number };
export type ParseResult = { ok: true; data: ParsedImport } | { ok: false; error: string };

/** Parses CSV text into rows of cells, honoring quoted cells, doubled quotes, and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** "2026-10-05" or "10/05/2026" to YYYY-MM-DD, or null. */
export function parseDay(value: string): string | null {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** "09:05:00", "9:05 AM", or "14:30" to HH:MM, or null. */
export function parseClock(value: string): string | null {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/.exec(value.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0);
  }
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** "01:30:00" to whole minutes, rounding seconds to the nearest minute, or null. */
export function parseDurationText(value: string): number | null {
  const m = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]) + (Number(m[3] ?? 0) >= 30 ? 1 : 0);
}

function minutesBetweenWallClock(day: string, time: string, endDay: string, endTime: string): number {
  const a = new Date(centralToUtc(day, time)).getTime();
  const b = new Date(centralToUtc(endDay, endTime)).getTime();
  return Math.round((b - a) / 60000);
}

/** Reads a Toggl or Clockify time-entry export. Rows that can't be read or last under a minute are counted as skipped. */
export function parseTimeExport(text: string): ParseResult {
  const table = parseCsv(text);
  if (table.length < 2) return { ok: false, error: "That file has no time entries." };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const iProject = col("project");
  const iStartDate = col("start date");
  const iStartTime = col("start time");
  if (iProject < 0 || iStartDate < 0 || iStartTime < 0) {
    return { ok: false, error: "This doesn't look like a Toggl or Clockify time-entry export (needs Project, Start date, and Start time columns)." };
  }
  const clockify = header.includes("duration (h)") || header.includes("duration (decimal)");
  const iClient = col("client");
  const iDesc = col("description");
  const iEndDate = col("end date");
  const iEndTime = col("end time");
  const iDuration = col("duration", "duration (h)");
  const iDecimal = col("duration (decimal)");
  const iBillable = col("billable");

  const rows: ImportRow[] = [];
  let skipped = 0;
  for (const cells of table.slice(1)) {
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const day = parseDay(get(iStartDate));
    const time = parseClock(get(iStartTime));
    if (!day || !time) {
      skipped++;
      continue;
    }
    let minutes = parseDurationText(get(iDuration));
    if (minutes === null && iDecimal >= 0 && get(iDecimal) !== "" && Number.isFinite(Number(get(iDecimal)))) minutes = Math.round(Number(get(iDecimal)) * 60);
    if (minutes === null) {
      const endDay = parseDay(get(iEndDate));
      const endTime = parseClock(get(iEndTime));
      if (endDay && endTime) minutes = minutesBetweenWallClock(day, time, endDay, endTime);
    }
    if (minutes === null || minutes < 1 || minutes > 24 * 60) {
      skipped++;
      continue;
    }
    rows.push({
      client: get(iClient),
      project: get(iProject) || "No project",
      description: get(iDesc).slice(0, 200),
      day,
      time,
      minutes,
      billable: iBillable < 0 ? true : /^(yes|true|1)$/i.test(get(iBillable)),
    });
  }
  if (rows.length === 0) return { ok: false, error: "No readable time entries were found in that file." };
  return { ok: true, data: { source: clockify ? "Clockify" : "Toggl", rows, skipped } };
}

export type ProjectGroup = { key: string; client: string; project: string; count: number; minutes: number };

export const groupKey = (client: string, project: string) => `${client}\u0000${project}`;

/** The distinct client and project pairs in the file, in first-seen order, with entry counts and minutes. */
export function groupProjects(rows: ImportRow[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();
  for (const r of rows) {
    const key = groupKey(r.client, r.project);
    const g = map.get(key) ?? { key, client: r.client, project: r.project, count: 0, minutes: 0 };
    g.count++;
    g.minutes += r.minutes;
    map.set(key, g);
  }
  return [...map.values()];
}

/** Picks the existing project with the same name (and client, when the file has one), ignoring case. */
export function suggestProject(
  group: { client: string; project: string },
  projects: { id: number; name: string; clientName: string }[],
): number | null {
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const named = projects.filter((p) => same(p.name, group.project));
  const exact = named.find((p) => group.client !== "" && same(p.clientName, group.client));
  return (exact ?? (group.client === "" ? named[0] : undefined))?.id ?? null;
}

/** UTC start and end timestamps for a row, from its Central wall-clock start. */
export function rowTimes(row: Pick<ImportRow, "day" | "time" | "minutes">): { startedAt: string; endedAt: string } {
  const startedAt = centralToUtc(row.day, row.time);
  return { startedAt, endedAt: new Date(new Date(startedAt).getTime() + row.minutes * 60000).toISOString() };
}

/** Re-validates rows that came back from the browser, dropping anything malformed. */
export function sanitizeRows(input: unknown): ImportRow[] {
  if (!Array.isArray(input)) return [];
  const out: ImportRow[] = [];
  for (const r of input.slice(0, 5000)) {
    if (typeof r !== "object" || r === null) continue;
    const { client, project, description, day, time, minutes, billable } = r as Record<string, unknown>;
    if (typeof day !== "string" || parseDay(day) !== day || typeof time !== "string" || parseClock(time) !== time) continue;
    if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 24 * 60) continue;
    out.push({
      client: typeof client === "string" ? client.slice(0, 200) : "",
      project: typeof project === "string" && project !== "" ? project.slice(0, 200) : "No project",
      description: typeof description === "string" ? description.slice(0, 200) : "",
      day,
      time,
      minutes,
      billable: billable === true,
    });
  }
  return out;
}
