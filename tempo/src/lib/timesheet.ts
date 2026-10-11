import { centralToUtc, localDay } from "@/lib/entries";

const DAY_MS = 86400000;

/** Adds calendar days to a YYYY-MM-DD string. */
export function addDays(day: string, n: number): string {
  return new Date(new Date(`${day}T12:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** Monday (YYYY-MM-DD) of the week containing `day`. */
export function weekStart(day: string): string {
  const dow = new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(day, -((dow + 6) % 7));
}

/** The seven days of the week starting at `start`. */
export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** UTC bounds [from, to) of the Central-time week starting at `start`. */
export function weekRange(start: string): { from: string; to: string } {
  return { from: centralToUtc(start, "00:00"), to: centralToUtc(addDays(start, 7), "00:00") };
}

export type SheetEntry = { projectId: number; startedAt: string; minutes: number };
export type SheetRow = { projectId: number; cells: number[]; total: number };

/** Sums entries into a projects-by-days grid; `days` are the column days. */
export function buildGrid(entries: SheetEntry[], days: string[]): { rows: SheetRow[]; columnTotals: number[]; total: number } {
  const byProject = new Map<number, number[]>();
  for (const e of entries) {
    const col = days.indexOf(localDay(e.startedAt));
    if (col < 0) continue;
    const cells = byProject.get(e.projectId) ?? days.map(() => 0);
    cells[col] += e.minutes;
    byProject.set(e.projectId, cells);
  }
  const rows = [...byProject].map(([projectId, cells]) => ({ projectId, cells, total: cells.reduce((a, b) => a + b, 0) }));
  const columnTotals = days.map((_, i) => rows.reduce((a, r) => a + r.cells[i], 0));
  return { rows, columnTotals, total: columnTotals.reduce((a, b) => a + b, 0) };
}

export type CellEntry = { id: number; startedAt: string; minutes: number; billed: boolean };
export type CellPlan =
  | { ok: true; updates: { id: number; minutes: number }[]; deletes: number[]; create: number }
  | { ok: false; error: string };

/**
 * Plans the changes that make a project-day cell total `target` minutes.
 * Billed entries are locked; the difference is taken from or added to unbilled
 * entries, newest first, and a new entry is created only when none can grow.
 */
export function planCellEdit(entries: CellEntry[], target: number): CellPlan {
  if (target < 0 || target > 24 * 60) return { ok: false, error: "A day can't have more than 24 hours." };
  const billed = entries.filter((e) => e.billed).reduce((a, e) => a + e.minutes, 0);
  if (target < billed) return { ok: false, error: "Billed time can't be reduced." };
  const open = entries.filter((e) => !e.billed).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const current = open.reduce((a, e) => a + e.minutes, 0);
  const want = target - billed;
  if (want === current) return { ok: true, updates: [], deletes: [], create: 0 };
  if (want > current) {
    const delta = want - current;
    if (open.length === 0) return { ok: true, updates: [], deletes: [], create: delta };
    return { ok: true, updates: [{ id: open[0].id, minutes: open[0].minutes + delta }], deletes: [], create: 0 };
  }
  let excess = current - want;
  const updates: { id: number; minutes: number }[] = [];
  const deletes: number[] = [];
  for (const e of open) {
    if (excess <= 0) break;
    if (e.minutes <= excess) {
      deletes.push(e.id);
      excess -= e.minutes;
    } else {
      updates.push({ id: e.id, minutes: e.minutes - excess });
      excess = 0;
    }
  }
  return { ok: true, updates, deletes, create: 0 };
}
