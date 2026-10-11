"use server";

import { revalidatePath } from "next/cache";
import { createClient, renameClient } from "@/server/db/queries";

export type ClientState = { error?: string; ok?: boolean } | null;

export async function addClient(_prev: ClientState, form: FormData): Promise<ClientState> {
  const name = String(form.get("name") ?? "").trim();
  const businessId = Number(form.get("businessId"));
  if (!name) return { error: "Name is required" };
  if (!Number.isInteger(businessId) || businessId <= 0) return { error: "Pick a business" };
  await createClient(businessId, name);
  revalidatePath("/clients");
  return { ok: true };
}

export async function updateClientName(id: number, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await renameClient(id, name);
  revalidatePath("/clients");
  revalidatePath("/projects");
}
