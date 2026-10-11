"use server";

import { revalidatePath } from "next/cache";
import { parseEntryForm } from "@/lib/entries";
import { createManualEntry, deleteEntry, restartEntry } from "@/server/db/queries";
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

export async function restartEntryAction(id: number) {
  const user = await getCurrentUser();
  await restartEntry(user.email, id);
  revalidatePath("/", "layout");
}
