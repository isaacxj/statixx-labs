"use server";

import { revalidatePath } from "next/cache";
import { parseEntryForm } from "@/lib/entries";
import { parseHoursToMinutes } from "@/lib/project-form";
import { createManualEntry, deleteEntry, restartEntry, restoreEntry, splitEntry, updateEntry } from "@/server/db/queries";
import { getCurrentUser } from "@/server/user";

export type EntryFormState = { errors: Record<string, string>; saved?: number } | null;

export async function addEntry(_prev: EntryFormState, form: FormData): Promise<EntryFormState> {
  const parsed = parseEntryForm(form);
  if (!parsed.ok) return { errors: parsed.errors };
  const user = await getCurrentUser();
  await createManualEntry(user.email, parsed.data);
  revalidatePath("/", "layout");
  return { errors: {}, saved: Date.now() };
}

export async function deleteEntryAction(id: number) {
  const user = await getCurrentUser();
  await deleteEntry(user.email, id);
  revalidatePath("/", "layout");
}

export type DeletedEntry = { projectId: number; description: string; startedAt: string; endedAt: string; minutes: number; billable: boolean };

export async function restoreEntryAction(entry: DeletedEntry) {
  const user = await getCurrentUser();
  if (!Number.isInteger(entry.projectId) || !Number.isInteger(entry.minutes) || entry.minutes < 0) return;
  await restoreEntry(user.email, {
    projectId: entry.projectId,
    description: String(entry.description).slice(0, 200),
    startedAt: new Date(entry.startedAt).toISOString(),
    endedAt: new Date(entry.endedAt).toISOString(),
    minutes: entry.minutes,
    billable: Boolean(entry.billable),
  });
  revalidatePath("/", "layout");
}

export async function restartEntryAction(id: number) {
  const user = await getCurrentUser();
  await restartEntry(user.email, id);
  revalidatePath("/", "layout");
}

export async function updateEntryAction(id: number, _prev: EntryFormState, form: FormData): Promise<EntryFormState> {
  const parsed = parseEntryForm(form);
  if (!parsed.ok) return { errors: parsed.errors };
  const user = await getCurrentUser();
  await updateEntry(user.email, id, parsed.data);
  revalidatePath("/", "layout");
  return { errors: {}, saved: Date.now() };
}

export async function splitEntryAction(id: number, _prev: EntryFormState, form: FormData): Promise<EntryFormState> {
  const user = await getCurrentUser();
  const error = await splitEntry(user.email, id, parseHoursToMinutes(String(form.get("first") ?? "")));
  if (error) return { errors: { first: error } };
  revalidatePath("/", "layout");
  return { errors: {}, saved: Date.now() };
}
