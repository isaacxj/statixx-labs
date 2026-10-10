"use client";

import { useActionState, useEffect, useRef } from "react";
import { Banknote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { centsToText } from "@/lib/invoice-math";
import { METHOD_LABELS } from "@/lib/payments";
import { savePayment, type PaymentFormState } from "./actions";

export function PaymentSheet({ invoiceId, balanceCents, today }: { invoiceId: number; balanceCents: number; today: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(savePayment.bind(null, invoiceId), null);
  const e = state?.errors ?? {};

  useEffect(() => {
    if (state?.saved) dialog.current?.close();
  }, [state]);

  return (
    <>
      <Button type="button" data-shortcut="record-payment" onClick={() => dialog.current?.showModal()}><Banknote />Record payment</Button>
      {state?.saved && (
        <p role="status" className="bg-card rounded-card text-13 fixed right-4 bottom-20 z-50 border px-4 py-3 shadow-[var(--shadow-overlay)] md:bottom-4">
          Payment recorded.
        </p>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="payment-sheet-title"
        onClick={(ev) => ev.target === dialog.current && dialog.current?.close()}
        className="bg-card text-foreground rounded-sheet m-0 ml-auto h-dvh max-h-none w-full max-w-md border-l p-0 shadow-[var(--shadow-overlay)] backdrop:bg-black/40"
      >
        <form action={action} noValidate className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b px-5 py-4">
            <h2 id="payment-sheet-title" className="text-base font-semibold">Record payment</h2>
            <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={() => dialog.current?.close()}><X /></Button>
          </header>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            <Field id="pay-amount" label="Amount" hint="Defaults to the balance due." error={e.amount}>
              <Input key={balanceCents} id="pay-amount" name="amount" inputMode="decimal" className="font-mono tabular-nums" defaultValue={centsToText(balanceCents)} aria-invalid={e.amount ? true : undefined} aria-describedby={e.amount ? "pay-amount-msg" : undefined} />
            </Field>
            <Field id="pay-date" label="Date received" error={e.paidOn}>
              <Input id="pay-date" name="paidOn" type="date" defaultValue={today} max={today} aria-invalid={e.paidOn ? true : undefined} aria-describedby={e.paidOn ? "pay-date-msg" : undefined} />
            </Field>
            <Field id="pay-method" label="Method" error={e.method}>
              <Select id="pay-method" name="method" defaultValue="bank_transfer">
                {Object.entries(METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field id="pay-ref" label="Reference" hint="Optional: a cheque number or transfer ID.">
              <Input id="pay-ref" name="reference" maxLength={120} />
            </Field>
          </div>
          <footer className="flex items-center gap-3 border-t px-5 py-4">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Record payment"}</Button>
            <Button type="button" variant="ghost" onClick={() => dialog.current?.close()}>Cancel</Button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
