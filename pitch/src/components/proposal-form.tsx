"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveProposal, type ProposalFormState } from "@/app/(app)/proposals/actions";
import { formatProposalNumber } from "@/lib/proposal-form";
import type { Business, Client } from "@/server/db/schema";

const select =
  "border-input bg-card h-9 w-full rounded-sm border px-3 text-sm transition-colors duration-150 aria-[invalid=true]:border-danger max-md:h-11";

export function ProposalForm({ businesses, clients }: { businesses: Business[]; clients: Client[] }) {
  const [state, action, pending] = useActionState<ProposalFormState, FormData>(saveProposal, null);
  const errors = state?.errors ?? {};
  const err = (k: keyof typeof errors) =>
    errors[k] ? <p id={`${k}-error`} className="text-danger text-sm">{errors[k]}</p> : null;
  const aria = (k: keyof typeof errors) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-error` : undefined });

  return (
    <form action={action} className="bg-card flex max-w-2xl flex-col gap-4 rounded-md border p-4 md:p-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Website redesign" required {...aria("title")} />
        {err("title")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="businessId">From</Label>
          <select id="businessId" name="businessId" defaultValue="" required className={select} {...aria("businessId")}>
            <option value="" disabled>Choose a business</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name} · next {formatProposalNumber(b.numberPrefix, b.nextNumber)}</option>
            ))}
          </select>
          {err("businessId")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clientId">Client</Label>
          <select id="clientId" name="clientId" defaultValue="" required className={select} {...aria("clientId")}>
            <option value="" disabled>Choose a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>
            ))}
          </select>
          {err("clientId")}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create draft"}</Button>
        <Button variant="ghost" asChild><Link href="/proposals">Cancel</Link></Button>
      </div>
    </form>
  );
}
