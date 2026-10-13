"use server";

import { revalidatePath } from "next/cache";
import { parseMonitorForm, type MonitorFormResult } from "@/lib/monitor-form";
import { parseRecipient } from "@/lib/alerts";
import { addAlertRecipient, createMonitor, deleteMonitor, removeAlertRecipient, setAlertRecipientActive, setMonitorPaused, updateMonitor } from "@/server/db/queries";

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
