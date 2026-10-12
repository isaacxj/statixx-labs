import { PROJECT_STATUSES, type ProjectStatus } from "@/server/db/schema";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type ProjectInput = { name: string; status: ProjectStatus; summary: string; startsOn: string | null; dueOn: string | null };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(raw: FormDataEntryValue | null): string | null | undefined {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (!DAY.test(value) || Number.isNaN(Date.parse(`${value}T12:00:00Z`))) return undefined;
  return value;
}

export function parseProjectInput(form: FormData): Result<ProjectInput> {
  const name = String(form.get("name") ?? "").trim();
  const status = String(form.get("status") ?? "on_track");
  const summary = String(form.get("summary") ?? "").trim();
  const startsOn = parseDay(form.get("startsOn"));
  const dueOn = parseDay(form.get("dueOn"));
  if (!name) return { ok: false, error: "Enter a project name." };
  if (!(PROJECT_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Pick a status." };
  if (startsOn === undefined || dueOn === undefined) return { ok: false, error: "Dates must look like 2026-11-14." };
  if (startsOn && dueOn && dueOn < startsOn) return { ok: false, error: "The due date can't be before the start date." };
  return { ok: true, value: { name, status: status as ProjectStatus, summary, startsOn, dueOn } };
}
