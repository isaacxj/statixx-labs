"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createProposalFromTemplate, deleteTemplate } from "@/server/db/queries";

const asId = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export async function useTemplate(formData: FormData) {
  const templateId = asId(formData.get("templateId"));
  const clientId = asId(formData.get("clientId"));
  if (!templateId || !clientId) return;
  const draft = await createProposalFromTemplate(templateId, clientId, String(formData.get("title") ?? ""));
  if (draft) redirect(`/proposals/${draft.id}`);
}

export async function deleteTemplateAction(formData: FormData) {
  const id = asId(formData.get("id"));
  if (id) await deleteTemplate(id);
  revalidatePath("/templates");
}
