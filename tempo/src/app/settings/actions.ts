"use server";

import { revalidatePath } from "next/cache";
import { parseRounding } from "@/lib/rounding";
import { parseIdleLimitHours } from "@/lib/idle";
import { updateBusinessIdleLimit, updateBusinessRounding } from "@/server/db/queries";

export async function saveRounding(businessId: number, form: FormData) {
  const rounding = parseRounding(form.get("rounding"));
  if (rounding === null) return;
  await updateBusinessRounding(businessId, rounding);
  revalidatePath("/settings");
}

export async function saveIdleLimit(businessId: number, form: FormData) {
  const minutes = parseIdleLimitHours(form.get("idleHours"));
  if (minutes === null) return;
  await updateBusinessIdleLimit(businessId, minutes);
  revalidatePath("/settings");
}
