import type { Milestone } from "@/server/db/schema";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type MilestoneInput = { title: string; dueOn: string | null };
export type MilestoneState = "done" | "overdue" | "upcoming";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseMilestoneInput(form: FormData): Result<MilestoneInput> {
  const title = String(form.get("title") ?? "").trim();
  const due = String(form.get("dueOn") ?? "").trim();
  if (!title) return { ok: false, error: "Enter a milestone title." };
  if (due && (!DAY.test(due) || Number.isNaN(Date.parse(`${due}T12:00:00Z`)))) return { ok: false, error: "Dates must look like 2026-11-14." };
  return { ok: true, value: { title, dueOn: due || null } };
}

/** Done once it has a done date; overdue when its due day is before today (both "YYYY-MM-DD"). */
export function milestoneState(m: Pick<Milestone, "dueOn" | "doneOn">, today: string): MilestoneState {
  if (m.doneOn) return "done";
  return m.dueOn && m.dueOn < today ? "overdue" : "upcoming";
}

/** Timeline order: the saved position, then due date, then id. */
export function sortMilestones<T extends Pick<Milestone, "id" | "position" | "dueOn">>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position || (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999") || a.id - b.id);
}

export function milestoneProgress(items: Pick<Milestone, "doneOn">[]): { done: number; total: number } {
  return { done: items.filter((m) => m.doneOn).length, total: items.length };
}

/** The first milestone not yet done, in timeline order, or null when all are done or there are none. */
export function nextMilestone<T extends Pick<Milestone, "id" | "position" | "dueOn" | "doneOn">>(items: T[]): T | null {
  return sortMilestones(items).find((m) => !m.doneOn) ?? null;
}

/** Today in the team's zone, as "YYYY-MM-DD". */
export function todayInChicago(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(now);
}
