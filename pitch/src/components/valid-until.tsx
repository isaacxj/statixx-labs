"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { saveValidUntilAction } from "@/app/(app)/proposals/[id]/actions";

export function ValidUntil({ proposalId, initial }: { proposalId: number; initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [note, setNote] = useState<string | null>(null);
  const router = useRouter();
  const [pending, start] = useTransition();

  const commit = (next: string) =>
    start(async () => {
      const r = await saveValidUntilAction(proposalId, next);
      setNote(r.ok ? "Saved" : "Not a valid date");
      if (r.ok) router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="valid-until" className="text-muted-foreground text-sm">Valid until</label>
      <Input
        id="valid-until"
        type="date"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setNote(null);
          commit(e.target.value);
        }}
        disabled={pending}
        className="h-8 w-44 max-md:h-11"
      />
      <span role="status" aria-live="polite" className="text-muted-foreground text-xs">{note}</span>
    </div>
  );
}
