"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { saveStatusPageMonitors } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export type PickerMonitor = { id: number; name: string; client: string };
type Row = { monitorId: number; displayName: string; included: boolean };

/** Included monitors first in saved order, then the rest by name. */
function initialRows(monitors: PickerMonitor[], items: { monitorId: number; displayName: string }[]): Row[] {
  const byId = new Map(monitors.map((m) => [m.id, m]));
  const chosen = items.filter((i) => byId.has(i.monitorId)).map((i) => ({ monitorId: i.monitorId, displayName: i.displayName, included: true }));
  const chosenIds = new Set(chosen.map((c) => c.monitorId));
  const rest = monitors.filter((m) => !chosenIds.has(m.id)).map((m) => ({ monitorId: m.id, displayName: m.name, included: false }));
  return [...chosen, ...rest];
}

export function StatusPageMonitors({ pageId, monitors, items }: { pageId: number; monitors: PickerMonitor[]; items: { monitorId: number; displayName: string }[] }) {
  const [rows, setRows] = useState(() => initialRows(monitors, items));
  const [pending, start] = useTransition();
  const byId = new Map(monitors.map((m) => [m.id, m]));

  const patch = (i: number, p: Partial<Row>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...p } : row)));
  const move = (i: number, d: -1 | 1) =>
    setRows((r) => {
      const next = [...r];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const count = rows.filter((r) => r.included).length;

  if (monitors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
        <p className="font-medium">No monitors yet</p>
        <p className="text-muted-foreground text-sm">Add a monitor first, then pick it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="bg-card divide-y rounded-lg border">
        {rows.map((row, i) => {
          const m = byId.get(row.monitorId)!;
          const above = i > 0 && rows[i - 1].included;
          const below = i < rows.length - 1 && rows[i + 1].included;
          return (
            <li key={row.monitorId} className="flex flex-wrap items-center gap-3 px-4 py-2">
              <label className="flex min-w-0 flex-1 basis-48 items-center gap-3 max-md:min-h-11">
                <input type="checkbox" className="accent-primary size-4" checked={row.included} onChange={(e) => patch(i, { included: e.target.checked })} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{m.name}</span>
                  <span className="text-muted-foreground block truncate text-xs">{m.client || "No client"}</span>
                </span>
              </label>
              {row.included ? (
                <div className="flex flex-1 basis-56 items-center gap-1">
                  <Input aria-label={`Display name for ${m.name}`} value={row.displayName} onChange={(e) => patch(i, { displayName: e.target.value })} />
                  <Button variant="ghost" size="icon" aria-label={`Move ${m.name} up`} disabled={!above} onClick={() => move(i, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Move ${m.name} down`} disabled={!below} onClick={() => move(i, 1)}>
                    <ArrowDown />
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{count === 1 ? "1 monitor" : `${count} monitors`} on this page</p>
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveStatusPageMonitors(pageId, rows.filter((r) => r.included).map((r) => ({ monitorId: r.monitorId, displayName: r.displayName })));
              if (res.ok) toast.success(res.message);
              else toast.error(res.message);
            })
          }
        >
          {pending ? "Saving…" : "Save monitors"}
        </Button>
      </div>
    </div>
  );
}
