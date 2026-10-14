"use client";

import { useTransition } from "react";
import { Ban, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toaster";
import { duplicate, markSent, markVoid, undoSent, undoVoid } from "./actions";

export function InvoiceActions({ id, canSend, canVoid }: { id: number; canSend: boolean; canVoid: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();

  const send = () =>
    start(async () => {
      if (await markSent(id)) toast({ message: "Invoice marked as sent.", undo: () => undoSent(id) });
    });

  const voidIt = () => {
    if (!window.confirm("Void this invoice? It stays in the list marked void and its number is not reused.")) return;
    start(async () => {
      if (await markVoid(id)) toast({ message: "Invoice voided.", undo: () => undoVoid(id) });
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {canSend && (
        <Button type="button" data-shortcut="mark-sent" disabled={pending} onClick={send}><Send />Mark as sent</Button>
      )}
      <form action={duplicate.bind(null, id)}>
        <Button type="submit" variant="outline"><Copy />Duplicate</Button>
      </form>
      {canVoid && (
        <Button type="button" variant="outline" disabled={pending} onClick={voidIt}><Ban />Void</Button>
      )}
    </div>
  );
}
