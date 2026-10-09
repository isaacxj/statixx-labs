"use server";

import { revalidatePath } from "next/cache";
import { deleteLibrarySection } from "@/server/db/queries";

export async function deleteLibraryEntry(formData: FormData) {
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) await deleteLibrarySection(id);
  revalidatePath("/library");
}
