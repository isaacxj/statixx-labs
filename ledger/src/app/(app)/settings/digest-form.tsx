"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { saveDigestRecipient, type DigestFormState } from "./digest-actions";

export function DigestForm({ recipient }: { recipient: string }) {
  const [state, action, pending] = useActionState<DigestFormState, FormData>(saveDigestRecipient, null);
  return (
    <form action={action} className="bg-card rounded-card flex max-w-2xl flex-col gap-4 border p-4 md:p-6" noValidate>
      <div className="flex flex-col gap-1">
        <h2 className="text-16 font-semibold">Morning digest</h2>
        <p className="text-muted-foreground text-13">Overdue invoices, invoices due this week, and new retainer invoices, emailed each morning.</p>
      </div>
      {state?.saved && <p role="status" className="bg-success-soft text-success rounded-input px-3 py-2 text-13">Saved.</p>}
      <Field id="recipient" label="Send the digest to" error={state?.error} hint="Leave empty to turn the email off. Must be a verified address in Cloudflare Email Routing.">
        <Input
          id="recipient"
          name="recipient"
          type="email"
          defaultValue={recipient}
          placeholder="you@example.com"
          aria-invalid={state?.error ? true : undefined}
          aria-describedby="recipient-msg"
        />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
