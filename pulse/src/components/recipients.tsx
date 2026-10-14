"use client";

import { useActionState, useRef, useTransition } from "react";
import { Mail, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addRecipient, deleteRecipient, toggleRecipient, type RecipientState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export type RecipientRow = { id: number; email: string; active: boolean };

export function AddRecipientForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<RecipientState, FormData>(async (prev, form) => {
    const result = await addRecipient(prev, form);
    if (result?.ok) {
      toast.success(result.message);
      ref.current?.reset();
    }
    return result;
  }, null);
  return (
    <form ref={ref} action={action} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Field label="Email address" htmlFor="email" error={state?.ok === false ? state.error : undefined}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="off" placeholder="you@example.com" />
        </Field>
      </div>
      <Button type="submit" disabled={pending} className="sm:mt-[1.625rem]">
        <Plus aria-hidden /> Add recipient
      </Button>
    </form>
  );
}

export function RecipientList({ recipients }: { recipients: RecipientRow[] }) {
  const [pending, start] = useTransition();
  if (recipients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
        <Mail className="text-muted-foreground size-5" aria-hidden />
        <p className="font-medium">No one gets alerts yet</p>
        <p className="text-muted-foreground text-sm">Add an address above and the next outage will email it.</p>
      </div>
    );
  }
  return (
    <ul className="bg-card divide-y rounded-lg border">
      {recipients.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm">{r.email}</p>
            <p className="text-muted-foreground text-xs">{r.active ? "Receiving alerts" : "Muted"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => start(async () => { await toggleRecipient(r.id, !r.active); toast.success(r.active ? `Muted ${r.email}` : `Unmuted ${r.email}`); })}
            >
              {r.active ? "Mute" : "Unmute"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={pending}
              aria-label={`Remove ${r.email}`}
              onClick={() => start(async () => { await deleteRecipient(r.id); toast.success(`Removed ${r.email}`); })}
            >
              <Trash2 />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
