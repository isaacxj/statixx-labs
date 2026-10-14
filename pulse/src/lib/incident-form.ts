import type { IncidentStatus } from "@/server/db/schema";

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

export type IncidentInput = { title: string; monitorId: number; status: IncidentStatus; body: string };
export type IncidentErrors = Partial<Record<keyof IncidentInput, string>>;
export type IncidentFormResult = { ok: true; value: IncidentInput } | { ok: false; errors: IncidentErrors };

export type UpdateInput = { status: IncidentStatus; body: string };
export type UpdateErrors = Partial<Record<keyof UpdateInput, string>>;
export type UpdateFormResult = { ok: true; value: UpdateInput } | { ok: false; errors: UpdateErrors };

function parseStatus(raw: string): IncidentStatus | null {
  return raw in INCIDENT_STATUS_LABELS ? (raw as IncidentStatus) : null;
}

function parseBody(raw: string): string | { error: string } {
  const body = raw.trim();
  if (!body) return { error: "Say what is happening." };
  if (body.length > 2000) return { error: "Keep the message under 2000 characters." };
  return body;
}

export function parseUpdateForm(form: FormData): UpdateFormResult {
  const errors: UpdateErrors = {};
  const status = parseStatus(String(form.get("status") ?? ""));
  if (!status) errors.status = "Pick a status.";
  const body = parseBody(String(form.get("body") ?? ""));
  if (typeof body !== "string") errors.body = body.error;
  if (Object.keys(errors).length || !status || typeof body !== "string") return { ok: false, errors };
  return { ok: true, value: { status, body } };
}

export function parseIncidentForm(form: FormData): IncidentFormResult {
  const errors: IncidentErrors = {};
  const title = String(form.get("title") ?? "").trim();
  if (!title) errors.title = "Give the incident a title.";
  else if (title.length > 120) errors.title = "Keep the title under 120 characters.";
  const monitorId = Number(form.get("monitorId"));
  if (!Number.isInteger(monitorId) || monitorId <= 0) errors.monitorId = "Pick the affected component.";
  const update = parseUpdateForm(form);
  if (!update.ok) Object.assign(errors, update.errors);
  if (Object.keys(errors).length || !update.ok) return { ok: false, errors };
  return { ok: true, value: { title, monitorId, ...update.value } };
}
