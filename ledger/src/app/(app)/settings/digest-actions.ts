"use server";

import { revalidatePath } from "next/cache";
import { DIGEST_SETTING, parseRecipient } from "@/lib/digest";
import { setSetting } from "@/server/db/queries";

export type DigestFormState = { error?: string; saved?: boolean } | null;

export async function saveDigestRecipient(_prev: DigestFormState, data: FormData): Promise<DigestFormState> {
  const parsed = parseRecipient(String(data.get("recipient") ?? ""));
  if (!parsed.ok) return { error: parsed.error };
  await setSetting(DIGEST_SETTING, parsed.value);
  revalidatePath("/settings");
  revalidatePath("/digest");
  return { saved: true };
}
