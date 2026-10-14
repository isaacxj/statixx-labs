"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { postIncidentUpdate, saveIncident, type IncidentState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, controlClass } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { INCIDENT_STATUS_LABELS } from "@/lib/incident-form";
import type { IncidentStatus } from "@/server/db/schema";
import { cn } from "@/lib/utils";

const StatusOptions = () => (
  <>
    {(Object.keys(INCIDENT_STATUS_LABELS) as IncidentStatus[]).map((s) => (
      <option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</option>
    ))}
  </>
);

export function NewIncidentSheet({ pageId, components }: { pageId: number; components: { monitorId: number; displayName: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<IncidentState, FormData>(async (prev, form) => {
    const result = await saveIncident(pageId, prev, form);
    if (result?.ok && result.id) {
      toast.success(result.message);
      setOpen(false);
      router.push(`/incidents/${result.id}`);
    } else if (result?.message) toast.error(result.message);
    return result;
  }, null);
  const err = state?.errors ?? {};
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button disabled={components.length === 0}>
          <Plus aria-hidden /> Post incident
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div>
          <SheetTitle>Post an incident</SheetTitle>
          <SheetDescription>It appears on the public page right away. Add updates as things change.</SheetDescription>
        </div>
        <form action={action} noValidate className="flex flex-col gap-4">
          <Field label="Title" htmlFor="incident-title" error={err.title}>
            <Input id="incident-title" name="title" autoFocus placeholder="Online booking is slow" />
          </Field>
          <Field label="Affected component" htmlFor="incident-monitor" error={err.monitorId}>
            <Select id="incident-monitor" name="monitorId" defaultValue={components[0]?.monitorId}>
              {components.map((c) => (
                <option key={c.monitorId} value={c.monitorId}>{c.displayName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="incident-status" error={err.status}>
            <Select id="incident-status" name="status" defaultValue="investigating"><StatusOptions /></Select>
          </Field>
          <Field label="Message" htmlFor="incident-body" error={err.body}>
            <textarea id="incident-body" name="body" rows={4} className={cn(controlClass, "h-auto py-2")} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>{pending ? "Posting…" : "Post incident"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function UpdateForm({ incidentId, current }: { incidentId: number; current: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<IncidentState, FormData>(async (prev, form) => {
    const result = await postIncidentUpdate(incidentId, prev, form);
    if (result?.ok) {
      toast.success(result.message);
      router.refresh();
    } else if (result?.message) toast.error(result.message);
    return result;
  }, null);
  const err = state?.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <Field label="Status" htmlFor="update-status" error={err.status}>
        <Select id="update-status" name="status" defaultValue={current}><StatusOptions /></Select>
      </Field>
      <Field label="Message" htmlFor="update-body" error={err.body}>
        <textarea key={state?.ok ? "sent" : "draft"} id="update-body" name="body" rows={3} className={cn(controlClass, "h-auto py-2")} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Posting…" : "Post update"}</Button>
      </div>
    </form>
  );
}
