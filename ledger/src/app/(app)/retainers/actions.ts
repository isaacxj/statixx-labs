"use server";

import { revalidatePath } from "next/cache";
import { parseRetainerForm, type RetainerErrors } from "@/lib/retainer-form";
import { createRetainer, getRetainer, updateRetainer } from "@/server/db/queries";

export type RetainerFormState = { errors: RetainerErrors; saved?: number } | null;

export async function saveRetainer(id: number | null, _prev: RetainerFormState, data: FormData): Promise<RetainerFormState> {
  const parsed = parseRetainerForm(data);
  if (!parsed.ok) return { errors: parsed.errors };
  if (id !== null && !(await getRetainer(id))) return { errors: { title: "This retainer no longer exists." } };
  const savedId = id ?? (await createRetainer(parsed.value));
  if (id !== null) await updateRetainer(id, parsed.value);
  revalidatePath("/retainers");
  revalidatePath(`/retainers/${savedId}`);
  return { errors: {}, saved: savedId };
}
