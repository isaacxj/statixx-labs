"use server";

import { revalidatePath } from "next/cache";
import { parseClientForm, type ClientErrors } from "@/lib/client-form";
import { createClient, getClient, updateClient } from "@/server/db/queries";

export type ClientFormState = { errors: ClientErrors; saved?: number } | null;

export async function saveClient(id: number | null, _prev: ClientFormState, data: FormData): Promise<ClientFormState> {
  const parsed = parseClientForm(data);
  if (!parsed.ok) return { errors: parsed.errors };
  if (id !== null && !(await getClient(id))) return { errors: { name: "This client no longer exists." } };
  const savedId = id ?? (await createClient(parsed.value));
  if (id !== null) await updateClient(id, parsed.value);
  revalidatePath("/clients");
  revalidatePath(`/clients/${savedId}`);
  return { errors: {}, saved: savedId };
}
