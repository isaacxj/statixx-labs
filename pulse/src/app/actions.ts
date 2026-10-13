"use server";

import { revalidatePath } from "next/cache";
import { parseMonitorForm, type MonitorFormResult } from "@/lib/monitor-form";
import { parseRecipient } from "@/lib/alerts";
import { cleanPageMonitors, parseStatusPageForm, type StatusPageErrors } from "@/lib/status-page-form";
import { addAlertRecipient, createMonitor, createStatusPage, deleteMonitor, deleteStatusPage, getStatusPage, listMonitors, setStatusPageMonitors, updateStatusPage, removeAlertRecipient, setAlertRecipientActive, setMonitorPaused, updateMonitor } from "@/server/db/queries";

export type SaveState = { ok: boolean; message?: string; errors?: Extract<MonitorFormResult, { ok: false }>["errors"] } | null;

export async function saveMonitor(id: number | null, _prev: SaveState, form: FormData): Promise<SaveState> {
  const parsed = parseMonitorForm(form);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (id === null) await createMonitor(parsed.value);
  else await updateMonitor(id, parsed.value);
  revalidatePath("/");
  return { ok: true, message: id === null ? `Added ${parsed.value.name}` : `Saved ${parsed.value.name}` };
}

export async function togglePause(id: number, paused: boolean) {
  await setMonitorPaused(id, paused);
  revalidatePath("/");
}

export async function removeMonitor(id: number) {
  await deleteMonitor(id);
  revalidatePath("/");
}

export type RecipientState = { ok: boolean; message?: string; error?: string } | null;

export async function addRecipient(_prev: RecipientState, form: FormData): Promise<RecipientState> {
  const parsed = parseRecipient(String(form.get("email") ?? ""));
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const added = await addAlertRecipient(parsed.email);
  if (!added) return { ok: false, error: `${parsed.email} already gets alerts.` };
  revalidatePath("/settings");
  return { ok: true, message: `Alerts will go to ${parsed.email}` };
}

export async function toggleRecipient(id: number, active: boolean) {
  await setAlertRecipientActive(id, active);
  revalidatePath("/settings");
}

export async function deleteRecipient(id: number) {
  await removeAlertRecipient(id);
  revalidatePath("/settings");
}

export type StatusPageState = { ok: boolean; message?: string; errors?: StatusPageErrors; id?: number } | null;

export async function saveStatusPage(id: number | null, _prev: StatusPageState, form: FormData): Promise<StatusPageState> {
  const parsed = parseStatusPageForm(form);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const taken = { ok: false, errors: { slug: `"${parsed.value.slug}" is already used by another page.` } };
  if (id === null) {
    const newId = await createStatusPage(parsed.value);
    if (newId === null) return taken;
    revalidatePath("/status-pages");
    return { ok: true, id: newId, message: `Created ${parsed.value.title}` };
  }
  if (!(await updateStatusPage(id, parsed.value))) return taken;
  revalidatePath("/status-pages");
  revalidatePath(`/status-pages/${id}`);
  return { ok: true, id, message: `Saved ${parsed.value.title}` };
}

export async function saveStatusPageMonitors(id: number, items: { monitorId: number; displayName: string }[]) {
  if (!(await getStatusPage(id))) return { ok: false as const, message: "That page no longer exists." };
  const names = new Map((await listMonitors()).map((m) => [m.id, m.name]));
  const cleaned = cleanPageMonitors(items, names);
  await setStatusPageMonitors(id, cleaned);
  revalidatePath("/status-pages");
  revalidatePath(`/status-pages/${id}`);
  return { ok: true as const, message: cleaned.length === 1 ? "Showing 1 monitor" : `Showing ${cleaned.length} monitors` };
}

export async function removeStatusPage(id: number) {
  await deleteStatusPage(id);
  revalidatePath("/status-pages");
}
