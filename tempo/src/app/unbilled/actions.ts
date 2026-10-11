"use server";

import { revalidatePath } from "next/cache";
import { markClientBilled } from "@/server/db/queries";

/** Marks everything the page showed for this client as billed, tagged with an optional invoice reference. */
export async function markBilled(clientId: number, upToId: number, form: FormData) {
  const ref = String(form.get("ref") ?? "").trim().slice(0, 100);
  await markClientBilled(clientId, ref, upToId);
  revalidatePath("/unbilled");
}
