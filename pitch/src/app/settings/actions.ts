"use server";

import { redirect } from "next/navigation";
import { parseBusinessForm, type BusinessErrors } from "@/lib/business-form";
import { createBusiness, updateBusiness } from "@/server/db/queries";

export type FormState = { errors: BusinessErrors } | null;

export async function saveBusiness(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseBusinessForm(formData);
  if ("errors" in parsed) return { errors: parsed.errors };
  if (id === null) await createBusiness(parsed.value);
  else await updateBusiness(id, parsed.value);
  redirect("/settings");
}
