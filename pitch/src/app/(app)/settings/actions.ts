"use server";

import { redirect } from "next/navigation";
import { parseBusinessForm, type BusinessErrors } from "@/lib/business-form";
import { logoKey, validateLogo } from "@/lib/logo";
import { createBusiness, getBusiness, updateBusiness } from "@/server/db/queries";
import { deleteLogo, putLogo } from "@/server/storage";

export type FormState = { errors: BusinessErrors & { logo?: string } } | null;

export async function saveBusiness(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseBusinessForm(formData);
  const upload = formData.get("logo");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  const logoError = file ? validateLogo(file) : null;
  if ("errors" in parsed) return { errors: { ...parsed.errors, ...(logoError ? { logo: logoError } : {}) } };
  if (logoError) return { errors: { logo: logoError } };

  const businessId = id ?? (await createBusiness(parsed.value));
  const existing = id === null ? null : await getBusiness(id);
  if (id !== null) await updateBusiness(id, parsed.value);

  const oldKey = existing?.logoKey ?? null;
  if (file) {
    const key = logoKey(businessId, file.type, Date.now());
    await putLogo(key, file);
    await updateBusiness(businessId, { logoKey: key });
    if (oldKey) await deleteLogo(oldKey);
  } else if (oldKey && formData.get("removeLogo")) {
    await updateBusiness(businessId, { logoKey: null });
    await deleteLogo(oldKey);
  }
  redirect("/settings");
}
