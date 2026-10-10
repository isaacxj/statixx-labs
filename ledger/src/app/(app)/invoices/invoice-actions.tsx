"use client";

import { Ban, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicate, markSent, markVoid } from "./actions";

export function InvoiceActions({ id, canSend, canVoid }: { id: number; canSend: boolean; canVoid: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {canSend && (
        <form action={markSent.bind(null, id)}>
          <Button type="submit" data-shortcut="mark-sent"><Send />Mark as sent</Button>
        </form>
      )}
      <form action={duplicate.bind(null, id)}>
        <Button type="submit" variant="outline"><Copy />Duplicate</Button>
      </form>
      {canVoid && (
        <form
          action={markVoid.bind(null, id)}
          onSubmit={(e) => {
            if (!window.confirm("Void this invoice? It stays in the list marked void and its number is not reused.")) e.preventDefault();
          }}
        >
          <Button type="submit" variant="outline"><Ban />Void</Button>
        </form>
      )}
    </div>
  );
}
