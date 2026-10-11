import { parseHoursToMinutes } from "@/lib/project-form";

export const TIME_ZONE = "America/Chicago";

/** Calendar day (YYYY-MM-DD) of a UTC timestamp, in Central time. */
export function localDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** Clock time ("9:05 AM") of a UTC timestamp, in Central time. */
export function localTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** Heading for a day: "Today", "Yesterday", or "Mon, Oct 6". */
export function dayLabel(day: string, today: string): string {
  if (day === today) return "Today";
  const d = new Date(`${day}T12:00:00Z`);
  const t = new Date(`${today}T12:00:00Z`);
  if (Math.round((t.getTime() - d.getTime()) / 86400000) === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(d);
}

/** Converts a Central wall-clock date and time to a UTC ISO timestamp. */
export function centralToUtc(day: string, time: string): string {
  const [y, mo, d] = day.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // Find the zone offset at that moment, then correct once for DST edges.
  const offsetAt = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(ms));
    const p = Object.fromEntries(parts.map((x) => [x.type, Number(x.value)]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - ms;
  };
  let ms = guess - offsetAt(guess);
  ms = guess - offsetAt(ms);
  return new Date(ms).toISOString();
}

export type DayGroup<T> = { day: string; minutes: number; entries: T[] };

/** Groups entries (newest first) by Central day, with each day's total minutes. */
export function groupByDay<T extends { startedAt: string; minutes: number }>(entries: T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const e of entries) {
    const day = localDay(e.startedAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) {
      last.entries.push(e);
      last.minutes += e.minutes;
    } else groups.push({ day, minutes: e.minutes, entries: [e] });
  }
  return groups;
}

export type EntryInput = { projectId: number; description: string; startedAt: string; endedAt: string; minutes: number };
export type EntryParse = { ok: true; data: EntryInput } | { ok: false; errors: Record<string, string> };

/** Validates the manual-entry form: project, date, start time, and a duration like "1:30" or "1.5". */
export function parseEntryForm(form: FormData): EntryParse {
  const errors: Record<string, string> = {};
  const projectId = Number(form.get("projectId"));
  if (!Number.isInteger(projectId) || projectId <= 0) errors.projectId = "Choose a project.";
  const day = String(form.get("day") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) errors.day = "Pick a date.";
  const time = String(form.get("start") ?? "");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) errors.start = "Enter a start time.";
  const minutes = parseHoursToMinutes(String(form.get("duration") ?? ""));
  if (minutes === null || minutes <= 0) errors.duration = "Enter hours like 1:30 or 1.5.";
  else if (minutes > 24 * 60) errors.duration = "An entry can't be longer than 24 hours.";
  if (Object.keys(errors).length > 0 || minutes === null) return { ok: false, errors };
  const startedAt = centralToUtc(day, time);
  const endedAt = new Date(new Date(startedAt).getTime() + minutes * 60000).toISOString();
  return { ok: true, data: { projectId, description: String(form.get("description") ?? "").trim().slice(0, 200), startedAt, endedAt, minutes } };
}

/** Splits a finished entry after `firstMinutes`, returning both halves' times, or an error message. */
export function splitEntryTimes(
  startedAt: string,
  minutes: number,
  firstMinutes: number | null,
): { ok: true; first: { endedAt: string; minutes: number }; second: { startedAt: string; endedAt: string; minutes: number } } | { ok: false; error: string } {
  if (firstMinutes === null || firstMinutes <= 0) return { ok: false, error: "Enter the first part's length, like 1:00 or 0.5." };
  if (firstMinutes >= minutes) return { ok: false, error: "The first part must be shorter than the entry." };
  const mid = new Date(new Date(startedAt).getTime() + firstMinutes * 60000).toISOString();
  const end = new Date(new Date(startedAt).getTime() + minutes * 60000).toISOString();
  return { ok: true, first: { endedAt: mid, minutes: firstMinutes }, second: { startedAt: mid, endedAt: end, minutes: minutes - firstMinutes } };
}
