"use server";

import { revalidatePath } from "next/cache";
import { parseMonitorForm, type MonitorFormResult } from "@/lib/monitor-form";
import { createMonitor, deleteMonitor, setMonitorPaused, updateMonitor } from "@/server/db/queries";

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
