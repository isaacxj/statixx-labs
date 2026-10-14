"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { saveClient, type ClientFormState } from "./actions";

export type ClientDefaults = { id: number | null; name: string; company: string; email: string; address: string };

export function ClientSheet({ defaults, variant = "default" }: { defaults: ClientDefaults; variant?: "default" | "outline" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [state, action, pending] = useActionState<ClientFormState, FormData>(saveClient.bind(null, defaults.id), null);
  const e = state?.errors ?? {};
  const creating = defaults.id === null;

  useEffect(() => {
    if (!state?.saved) return;
    dialog.current?.close();
    if (creating) router.push(`/clients/${state.saved}`);
  }, [state, creating, router]);

  return (
    <>
      <Button type="button" variant={variant} onClick={() => dialog.current?.showModal()}>
        {creating ? <Plus /> : <Pencil />}
        {creating ? "New client" : "Edit"}
      </Button>
      {state?.saved && (
        <p role="status" className="bg-card rounded-card text-13 fixed right-4 bottom-20 z-50 border px-4 py-3 shadow-[var(--shadow-overlay)] md:bottom-4">
          {creating ? "Client added." : "Client saved."}
        </p>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="client-sheet-title"
        onClick={(ev) => ev.target === dialog.current && dialog.current?.close()}
        className="bg-card text-foreground rounded-sheet m-0 ml-auto h-dvh max-h-none w-full max-w-md border-l p-0 shadow-[var(--shadow-overlay)] backdrop:bg-black/40"
      >
        <form action={action} noValidate className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b px-5 py-4">
            <h2 id="client-sheet-title" className="text-base font-semibold">{creating ? "New client" : "Edit client"}</h2>
            <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={() => dialog.current?.close()}><X /></Button>
          </header>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            <Field id="client-name" label="Name" error={e.name}>
              <Input id="client-name" name="name" defaultValue={defaults.name} required autoFocus aria-invalid={e.name ? true : undefined} aria-describedby={e.name ? "client-name-msg" : undefined} />
            </Field>
            <Field id="client-company" label="Company">
              <Input id="client-company" name="company" defaultValue={defaults.company} />
            </Field>
            <Field id="client-email" label="Email" error={e.email}>
              <Input id="client-email" name="email" type="email" defaultValue={defaults.email} aria-invalid={e.email ? true : undefined} aria-describedby={e.email ? "client-email-msg" : undefined} />
            </Field>
            <Field id="client-address" label="Address">
              <Textarea id="client-address" name="address" defaultValue={defaults.address} rows={3} />
            </Field>
          </div>
          <footer className="flex items-center gap-3 border-t px-5 py-4">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : creating ? "Add client" : "Save changes"}</Button>
            <Button type="button" variant="ghost" onClick={() => dialog.current?.close()}>Cancel</Button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
