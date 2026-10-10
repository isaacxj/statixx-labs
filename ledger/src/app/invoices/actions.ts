"use server";

import { revalidatePath } from "next/cache";
import { parseInvoiceForm, type InvoiceErrors } from "@/lib/invoice-form";
import { createInvoice, updateDraftInvoice } from "@/server/db/queries";

export type InvoiceFormState = { errors: InvoiceErrors; saved?: number } | null;

export async function saveInvoice(id: number | null, _prev: InvoiceFormState, data: FormData): Promise<InvoiceFormState> {
  const parsed = parseInvoiceForm(data);
  if (!parsed.ok) return { errors: parsed.errors };
  let savedId: number | null;
  if (id === null) savedId = await createInvoice(parsed.value);
  else savedId = (await updateDraftInvoice(id, parsed.value)) ? id : null;
  if (savedId === null) return { errors: { items: "This invoice can no longer be saved. Reload and try again." } };
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${savedId}`);
  return { errors: {}, saved: savedId };
}
