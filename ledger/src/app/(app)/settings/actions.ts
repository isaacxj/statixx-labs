"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkLogo, parseBusinessForm, type BusinessErrors } from "@/lib/business-form";
import { createBusiness, getBusiness, setBusinessLogo, updateBusiness } from "@/server/db/queries";
import { deleteLogo, putLogo } from "@/server/logos";

export type BusinessFormState = { errors: BusinessErrors; logo?: string; saved?: boolean } | null;

export async function saveBusiness(id: number | null, _prev: BusinessFormState, data: FormData): Promise<BusinessFormState> {
  const parsed = parseBusinessForm(data);
  const file = data.get("logo");
  const logo = file instanceof File && file.size > 0 ? file : null;
  const logoError = logo ? checkLogo(logo) : null;
  if (!parsed.ok || logoError) {
    return { errors: parsed.ok ? {} : parsed.errors, logo: logoError ?? undefined };
  }

  const businessId = id ?? (await createBusiness(parsed.value));
  if (id !== null) {
    if (!(await getBusiness(id))) redirect("/settings");
    await updateBusiness(id, parsed.value);
  }
  if (logo) {
    const previous = (await getBusiness(businessId))?.logoKey;
    await setBusinessLogo(businessId, await putLogo(businessId, logo));
    if (previous) await deleteLogo(previous);
  } else if (data.get("removeLogo") === "on") {
    const previous = (await getBusiness(businessId))?.logoKey;
    await setBusinessLogo(businessId, null);
    if (previous) await deleteLogo(previous);
  }

  revalidatePath("/settings");
  if (id === null) redirect(`/settings?saved=${encodeURIComponent(parsed.value.name)}`);
  return { errors: {}, saved: true };
}
