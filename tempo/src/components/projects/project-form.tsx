"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { BILLING_LABELS } from "@/lib/format";
import { BILLING_TYPES, type BillingType } from "@/server/db/schema";
import { saveProject, type FormState } from "@/app/projects/actions";

export type ProjectDefaults = {
  clientId: number | "";
  name: string;
  billing: BillingType;
  rate: string;
  fixedFee: string;
  budget: string;
  color: string;
};

const SWATCHES = ["#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6", "#EF4444", "#71717A"];

function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
      {error && (
        <p className="text-danger text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProjectForm({
  id,
  clients,
  defaults,
}: {
  id: number | null;
  clients: { id: number; name: string; businessName: string }[];
  defaults: ProjectDefaults;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProject.bind(null, id), null);
  const [billing, setBilling] = useState<BillingType>(defaults.billing);
  const [clientId, setClientId] = useState(String(defaults.clientId));
  const e = state?.errors ?? {};


  return (
    <form
      // Submitted by hand so React doesn't reset the fields when validation fails.
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      className="bg-card rounded-card flex flex-col gap-4 border p-4">
      <Field label="Client" htmlFor="clientId" error={e.clientId}>
        <Select id="clientId" name="clientId" value={clientId} onChange={(ev) => setClientId(ev.target.value)} required>
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.businessName})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Project name" htmlFor="name" error={e.name}>
        <Input id="name" name="name" defaultValue={defaults.name} required />
      </Field>
      <Field label="Billing" htmlFor="billing" error={e.billing}>
        <Select id="billing" name="billing" value={billing} onChange={(ev) => setBilling(ev.target.value as BillingType)}>
          {BILLING_TYPES.map((b) => (
            <option key={b} value={b}>
              {BILLING_LABELS[b]}
            </option>
          ))}
        </Select>
      </Field>
      {billing === "hourly" && (
        <Field label="Hourly rate" htmlFor="rate" error={e.rate} hint="In the business's currency">
          <Input id="rate" name="rate" inputMode="decimal" defaultValue={defaults.rate} className="font-mono tabular-nums" />
        </Field>
      )}
      {billing === "fixed" && (
        <Field label="Fixed fee" htmlFor="fixedFee" error={e.fixedFee}>
          <Input id="fixedFee" name="fixedFee" inputMode="decimal" defaultValue={defaults.fixedFee} className="font-mono tabular-nums" />
        </Field>
      )}
      <Field label="Budget (hours)" htmlFor="budget" error={e.budget} hint="Optional. Use 40, 12.5, or 12:30">
        <Input id="budget" name="budget" inputMode="decimal" defaultValue={defaults.budget} className="font-mono tabular-nums" />
      </Field>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">Color</legend>
        <div className="flex flex-wrap gap-2">
          {SWATCHES.map((c) => (
            <label key={c} className="relative flex size-8 cursor-pointer items-center justify-center max-md:size-11">
              <input type="radio" name="color" value={c} defaultChecked={defaults.color.toUpperCase() === c} className="peer sr-only" />
              <span className="peer-checked:ring-ring peer-focus-visible:outline-2 size-6 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-card max-md:size-8" style={{ backgroundColor: c }} />
              <span className="sr-only">{c}</span>
            </label>
          ))}
        </div>
        {e.color && (
          <p className="text-danger text-xs" role="alert">
            {e.color}
          </p>
        )}
      </fieldset>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {id === null ? "Create project" : "Save changes"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/projects">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
