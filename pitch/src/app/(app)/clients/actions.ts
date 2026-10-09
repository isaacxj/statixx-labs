"use server";

import { redirect } from "next/navigation";
import { parseClientForm, type ClientErrors } from "@/lib/client-form";
import { createClient, updateClient } from "@/server/db/queries";

export type ClientFormState = { errors: ClientErrors } | null;

export async function saveClient(id: number | null, _prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const parsed = parseClientForm(formData);
  if ("errors" in parsed) return { errors: parsed.errors };
  if (id === null) await createClient(parsed.value);
  else await updateClient(id, parsed.value);
  redirect("/clients");
}
