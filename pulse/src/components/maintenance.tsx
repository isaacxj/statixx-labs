"use client";

import { useActionState, useRef, useTransition } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addMaintenanceWindow, removeMaintenanceWindow, type WindowState } from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { windowState } from "@/lib/maintenance";
import { formatCheckedAt } from "@/lib/monitors";

export type WindowRow = { id: number; monitorName: string; startsAt: string; endsAt: string; note: string };

export function MaintenanceForm({ monitors }: { monitors: { id: number; name: string }[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<WindowState, FormData>(async (prev, form) => {
    const result = await addMaintenanceWindow(prev, form);
    if (result?.ok) {
      toast.success(result.message);
      ref.current?.reset();
    }
    return result;
  }, null);
  const errors = state?.ok === false ? state.errors : undefined;
  if (monitors.length === 0) {
    return <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">Add a monitor first, then schedule maintenance for it.</p>;
  }
  return (
    <form ref={ref} action={action} noValidate className="bg-card grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Monitor" htmlFor="monitorId" error={errors?.monitorId}>
          <Select id="monitorId" name="monitorId" defaultValue={monitors[0].id}>
            {monitors.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Starts" htmlFor="startsAt" error={errors?.startsAt}>
        <Input id="startsAt" name="startsAt" type="datetime-local" />
      </Field>
      <Field label="Ends" htmlFor="endsAt" error={errors?.endsAt}>
        <Input id="endsAt" name="endsAt" type="datetime-local" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Note" htmlFor="note" hint="Shown on the public status page." error={errors?.note}>
          <Input id="note" name="note" maxLength={200} placeholder="Booking system upgrade" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          <Plus aria-hidden /> Schedule window
        </Button>
      </div>
    </form>
  );
}

export function MaintenanceList({ rows, now }: { rows: WindowRow[]; now: number }) {
  const [pending, start] = useTransition();
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
        <CalendarClock className="text-muted-foreground size-5" aria-hidden />
        <p className="font-medium">No maintenance scheduled</p>
        <p className="text-muted-foreground text-sm">Schedule a window above before planned work so it doesn&apos;t page anyone.</p>
      </div>
    );
  }
  return (
    <ul className="bg-card divide-y rounded-lg border">
      {rows.map((r) => {
        const state = windowState(r, now);
        return (
          <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.monitorName}</p>
              <p className="text-muted-foreground font-mono text-xs tabular-nums">{formatCheckedAt(r.startsAt)} – {formatCheckedAt(r.endsAt)}</p>
              {r.note ? <p className="text-muted-foreground truncate text-xs">{r.note}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {state === "active" ? <StatusBadge status="maintenance" /> : <span className="text-muted-foreground text-sm capitalize">{state}</span>}
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                aria-label={`Remove maintenance for ${r.monitorName}`}
                onClick={() => start(async () => { await removeMaintenanceWindow(r.id); toast.success("Maintenance window removed"); })}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
