"use server";

import { revalidatePath } from "next/cache";
import { parseRounding } from "@/lib/rounding";
import { updateBusinessRounding } from "@/server/db/queries";

export async function saveRounding(businessId: number, form: FormData) {
  const rounding = parseRounding(form.get("rounding"));
  if (rounding === null) return;
  await updateBusinessRounding(businessId, rounding);
  revalidatePath("/settings");
}
