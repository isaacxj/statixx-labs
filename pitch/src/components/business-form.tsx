"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { bpToPercent, formatProposalNumber } from "@/lib/business-form";
import { saveBusiness, type FormState } from "@/app/settings/actions";
import type { Business } from "@/server/db/schema";

export function BusinessForm({ business }: { business?: Business }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBusiness.bind(null, business?.id ?? null), null);
  const errors = state?.errors ?? {};
  const [name, setName] = useState(business?.name ?? "");
  const [accent, setAccent] = useState(business?.accent ?? "#8B5CF6");
  const [prefix, setPrefix] = useState(business?.numberPrefix ?? "");
  const next = business?.nextNumber ?? 1;

  const err = (k: keyof typeof errors) =>
    errors[k] ? (
      <p id={`${k}-error`} className="text-danger text-sm">{errors[k]}</p>
    ) : null;
  const aria = (k: keyof typeof errors) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-error` : undefined });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <form action={action} className="bg-card flex flex-col gap-4 rounded-md border p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required {...aria("name")} />
            {err("name")}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="legalName">Legal name</Label>
            <Input id="legalName" name="legalName" defaultValue={business?.legalName ?? ""} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" defaultValue={business?.address ?? ""} className="min-h-16" />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency">Currency</Label>
            <select id="currency" name="currency" defaultValue={business?.currency ?? "USD"} className="border-input bg-background h-9 rounded-sm border px-3 text-base max-md:h-11">
              <option>USD</option>
              <option>CAD</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="taxRate">Tax rate %</Label>
            <Input id="taxRate" name="taxRate" inputMode="decimal" defaultValue={bpToPercent(business?.taxRateBp ?? 0)} className="tabular" {...aria("taxRateBp")} />
            {err("taxRateBp")}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numberPrefix">Number prefix</Label>
            <Input id="numberPrefix" name="numberPrefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="tabular uppercase" maxLength={6} required {...aria("numberPrefix")} />
            {err("numberPrefix")}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accent">Accent</Label>
            <Input id="accent" name="accent" value={accent} onChange={(e) => setAccent(e.target.value)} className="tabular" {...aria("accent")} />
            {err("accent")}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="defaultTermsMd">Default terms (markdown)</Label>
          <Textarea id="defaultTermsMd" name="defaultTermsMd" defaultValue={business?.defaultTermsMd ?? ""} className="min-h-32" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
          <Button variant="ghost" asChild><Link href="/settings">Cancel</Link></Button>
        </div>
      </form>

      <aside aria-label="Preview" className="bg-card h-fit rounded-lg border p-4">
        <p className="text-muted-foreground text-xs">Client view header</p>
        <div className="mt-3 border-t-4 pt-3" style={{ borderColor: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : undefined }}>
          <p className="text-xl font-semibold">{name || "Business name"}</p>
          <p className="tabular text-muted-foreground mt-1 text-sm">
            {formatProposalNumber(prefix.toUpperCase() || "XXX", new Date().getFullYear(), next)}
          </p>
        </div>
      </aside>
    </div>
  );
}
