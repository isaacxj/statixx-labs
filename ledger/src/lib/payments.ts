import type { InvoiceStatus, PaymentMethod } from "@/server/db/schema";
import { isIsoDate } from "./dates";
import { parseMoney } from "./invoice-math";

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  e_transfer: "E-transfer",
  card: "Card",
  cheque: "Cheque",
  cash: "Cash",
  other: "Other",
};

/** Money can be recorded against anything issued and not yet settled. */
export const canRecordPayment = (s: InvoiceStatus) =>
  s === "sent" || s === "viewed" || s === "partially_paid" || s === "overdue";

export const balanceCents = (totalCents: number, paidCents: number) => Math.max(0, totalCents - paidCents);

/** The status an invoice takes once `paidCents` has been received. */
export function statusAfterPayment(totalCents: number, paidCents: number): "paid" | "partially_paid" {
  return paidCents >= totalCents ? "paid" : "partially_paid";
}

export type PaymentInput = { amountCents: number; paidOn: string; method: PaymentMethod; reference: string };
export type PaymentErrors = Partial<Record<"amount" | "paidOn" | "method", string>>;

const str = (d: FormData, k: string) => String(d.get(k) ?? "").trim();

export function parsePaymentForm(
  data: FormData,
  balance: number,
  today: string,
): { ok: true; value: PaymentInput } | { ok: false; errors: PaymentErrors } {
  const errors: PaymentErrors = {};
  const amountCents = parseMoney(str(data, "amount"));
  if (amountCents === null || amountCents <= 0) errors.amount = "Enter an amount above zero.";
  else if (amountCents > balance) errors.amount = "That is more than the balance due.";
  const paidOn = str(data, "paidOn");
  if (!isIsoDate(paidOn)) errors.paidOn = "Enter a valid date.";
  else if (paidOn > today) errors.paidOn = "The date can't be in the future.";
  const method = str(data, "method") as PaymentMethod;
  if (!(method in METHOD_LABELS)) errors.method = "Pick a method.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { amountCents: amountCents!, paidOn, method, reference: str(data, "reference").slice(0, 120) } };
}
