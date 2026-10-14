"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseInvoiceForm, type InvoiceErrors } from "@/lib/invoice-form";
import { todayChicago } from "@/lib/dates";
import { balanceCents, canRecordPayment, parsePaymentForm, type PaymentErrors } from "@/lib/payments";
import { createInvoice, duplicateInvoice, getInvoice, recordPayment, sendInvoice, updateDraftInvoice, voidInvoice } from "@/server/db/queries";

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

function refresh(id: number) {
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

export async function markSent(id: number) {
  if (await sendInvoice(id)) refresh(id);
}

export async function markVoid(id: number) {
  if (await voidInvoice(id)) refresh(id);
}

export async function duplicate(id: number) {
  const copy = await duplicateInvoice(id);
  if (copy === null) return;
  revalidatePath("/invoices");
  redirect(`/invoices/${copy}`);
}

export type PaymentFormState = { errors: PaymentErrors; saved?: boolean } | null;

export async function savePayment(id: number, _prev: PaymentFormState, data: FormData): Promise<PaymentFormState> {
  const found = await getInvoice(id);
  if (!found || !canRecordPayment(found.invoice.status)) {
    return { errors: { amount: "This invoice can't take a payment. Reload and try again." } };
  }
  const { totalCents, paidCents } = found.invoice;
  const parsed = parsePaymentForm(data, balanceCents(totalCents, paidCents), todayChicago());
  if (!parsed.ok) return { errors: parsed.errors };
  if (!(await recordPayment(id, parsed.value))) return { errors: { amount: "The balance changed. Reload and try again." } };
  refresh(id);
  return { errors: {}, saved: true };
}
