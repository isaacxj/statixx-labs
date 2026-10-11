"use client";

import { useTransition } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { startTimerAction } from "@/app/timer-actions";
import type { QuickStartItem } from "@/lib/quick-start";

/** One-tap timer starts for recently used projects; the tap targets stay 44px on phones. */
export function QuickStart({ items }: { items: QuickStartItem[] }) {
  const [pending, startTransition] = useTransition();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="quick-start" className="flex flex-col gap-2">
      <h2 id="quick-start" className="text-muted-foreground text-sm font-medium">
        Start again
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((it) => {
          const label = it.description || it.projectName;
          return (
            <li key={`${it.projectId}|${it.description}`}>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await startTimerAction(it.projectId, it.description);
                    toast.success(`Timer started on ${it.projectName}`);
                  })
                }
                className="bg-card hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full items-center gap-3 rounded-card border px-4 py-2 text-left transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                aria-label={`Start timer: ${label}`}
              >
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: it.color }} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{label}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {it.description && `${it.projectName} · `}
                    {it.clientName}
                  </span>
                </span>
                <Play aria-hidden className="size-4 shrink-0 fill-current" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
