"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CURRENCIES } from "@/server/db/schema";
import { saveBusiness, type BusinessFormState } from "./actions";

export type BusinessDefaults = {
  id: number | null;
  name: string;
  legalName: string;
  address: string;
  accent: string;
  currency: string;
  taxRate: string;
  termsDays: string;
  paymentInstructions: string;
  numberPrefix: string;
  hasLogo: boolean;
};

export function BusinessForm({ defaults }: { defaults: BusinessDefaults }) {
  const [state, action, pending] = useActionState<BusinessFormState, FormData>(
    saveBusiness.bind(null, defaults.id),
    null,
  );
  const e = state?.errors ?? {};
  const invalid = (k: keyof typeof e) => (e[k] ? true : undefined);
  const describe = (id: string, k: keyof typeof e, hint?: boolean) => (e[k] || hint ? `${id}-msg` : undefined);

  return (
    <form action={action} className="bg-card rounded-card flex max-w-2xl flex-col gap-5 border p-4 md:p-6" noValidate>
      {state?.saved && (
        <p role="status" className="bg-success-soft text-success rounded-input px-3 py-2 text-13">Saved.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Name" error={e.name}>
          <Input id="name" name="name" defaultValue={defaults.name} required aria-invalid={invalid("name")} aria-describedby={describe("name", "name")} />
        </Field>
        <Field id="legalName" label="Legal name">
          <Input id="legalName" name="legalName" defaultValue={defaults.legalName} />
        </Field>
      </div>
      <Field id="address" label="Address">
        <Textarea id="address" name="address" defaultValue={defaults.address} rows={3} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="currency" label="Currency" error={e.currency}>
          <Select id="currency" name="currency" defaultValue={defaults.currency}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field id="taxRate" label="Tax rate (%)" error={e.taxRateBp} hint="Applied to new invoice lines, like 13 for 13%.">
          <Input id="taxRate" name="taxRate" inputMode="decimal" defaultValue={defaults.taxRate} aria-invalid={invalid("taxRateBp")} aria-describedby={describe("taxRate", "taxRateBp", true)} className="font-mono" />
        </Field>
        <Field id="termsDays" label="Payment terms (days)" error={e.termsDays}>
          <Input id="termsDays" name="termsDays" inputMode="numeric" defaultValue={defaults.termsDays} aria-invalid={invalid("termsDays")} aria-describedby={describe("termsDays", "termsDays")} className="font-mono" />
        </Field>
        <Field id="numberPrefix" label="Invoice number prefix" error={e.numberPrefix} hint="Invoices are numbered like STX-0001.">
          <Input id="numberPrefix" name="numberPrefix" defaultValue={defaults.numberPrefix} maxLength={6} aria-invalid={invalid("numberPrefix")} aria-describedby={describe("numberPrefix", "numberPrefix", true)} className="font-mono uppercase" />
        </Field>
      </div>
      <Field id="paymentInstructions" label="Payment instructions" hint="Shown to clients on the invoice, such as bank details or how to send an e-transfer.">
        <Textarea id="paymentInstructions" name="paymentInstructions" defaultValue={defaults.paymentInstructions} rows={4} aria-describedby="paymentInstructions-msg" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="accent" label="Accent color" error={e.accent} hint="Used on this business's client-facing invoices.">
          <Input id="accent" name="accent" type="color" defaultValue={defaults.accent} className="w-20 p-1" aria-describedby="accent-msg" />
        </Field>
        <Field id="logo" label="Logo" error={state?.logo} hint="PNG, JPEG, WebP, or SVG under 1 MB.">
          {defaults.id !== null && defaults.hasLogo && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/${defaults.id}`} alt={`${defaults.name} logo`} className="rounded-input bg-muted h-11 w-auto max-w-32 border object-contain p-1" />
              <label className="text-13 flex items-center gap-2">
                <input type="checkbox" name="removeLogo" className="size-4" /> Remove
              </label>
            </div>
          )}
          <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="py-1.5 file:mr-3 file:border-0 file:bg-transparent file:text-13 file:font-medium" aria-describedby="logo-msg" />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : defaults.id === null ? "Create business" : "Save changes"}</Button>
        <Button asChild variant="ghost"><Link href="/settings">Cancel</Link></Button>
      </div>
    </form>
  );
}
