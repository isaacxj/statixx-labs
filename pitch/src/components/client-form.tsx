"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { saveClient, type ClientFormState } from "@/app/clients/actions";
import type { Client } from "@/server/db/schema";

export function ClientForm({ client }: { client?: Client }) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(saveClient.bind(null, client?.id ?? null), null);
  const errors = state?.errors ?? {};
  const err = (k: keyof typeof errors) =>
    errors[k] ? <p id={`${k}-error`} className="text-danger text-sm">{errors[k]}</p> : null;
  const aria = (k: keyof typeof errors) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-error` : undefined });

  return (
    <form action={action} className="bg-card flex max-w-2xl flex-col gap-4 rounded-md border p-4 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={client?.name ?? ""} required {...aria("name")} />
          {err("name")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" defaultValue={client?.company ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} {...aria("email")} />
          {err("email")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={client?.phone ?? ""} className="tabular" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" defaultValue={client?.address ?? ""} className="min-h-16" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save client"}</Button>
        <Button variant="ghost" asChild><Link href="/clients">Cancel</Link></Button>
      </div>
    </form>
  );
}
