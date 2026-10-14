"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { saveMonitor, type SaveState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { INTERVALS } from "@/lib/monitor-form";
import { HTTP_METHODS } from "@/server/db/schema";

export type MonitorFormValues = {
  id: number;
  name: string;
  client: string;
  url: string;
  method: (typeof HTTP_METHODS)[number];
  intervalSec: number;
  timeoutMs: number;
  expectedStatus: number;
  keyword: string;
};

export function MonitorSheet({ monitor, trigger }: { monitor?: MonitorFormValues; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SaveState, FormData>(async (prev, form) => {
    const result = await saveMonitor(monitor?.id ?? null, prev, form);
    if (result?.ok) {
      toast.success(result.message);
      setOpen(false);
    }
    return result;
  }, null);

  const err = state?.errors ?? {};
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus aria-hidden /> Add monitor
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <div>
          <SheetTitle>{monitor ? "Edit monitor" : "Add monitor"}</SheetTitle>
          <SheetDescription>{monitor ? "Changes apply from the next check." : "Checks start within a minute."}</SheetDescription>
        </div>
        <form action={action} className="flex flex-1 flex-col gap-4" noValidate>
          <Field label="Name" htmlFor="name" error={err.name}>
            <Input id="name" name="name" defaultValue={monitor?.name} autoFocus placeholder="Marketing site" />
          </Field>
          <Field label="URL" htmlFor="url" error={err.url}>
            <Input id="url" name="url" defaultValue={monitor?.url} placeholder="https://example.com" inputMode="url" />
          </Field>
          <Field label="Client" htmlFor="client" hint="Optional. Used to filter and group.">
            <Input id="client" name="client" defaultValue={monitor?.client} placeholder="Northwind Dental" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Method" htmlFor="method" error={err.method}>
              <Select id="method" name="method" defaultValue={monitor?.method ?? "GET"}>
                {HTTP_METHODS.map((m) => <option key={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Check every" htmlFor="intervalSec" error={err.intervalSec}>
              <Select id="intervalSec" name="intervalSec" defaultValue={monitor?.intervalSec ?? 300}>
                {INTERVALS.map((i) => <option key={i.sec} value={i.sec}>{i.label}</option>)}
              </Select>
            </Field>
            <Field label="Expected status" htmlFor="expectedStatus" error={err.expectedStatus}>
              <Input id="expectedStatus" name="expectedStatus" type="number" defaultValue={monitor?.expectedStatus ?? 200} className="font-mono tabular-nums" />
            </Field>
            <Field label="Timeout (ms)" htmlFor="timeoutMs" error={err.timeoutMs}>
              <Input id="timeoutMs" name="timeoutMs" type="number" defaultValue={monitor?.timeoutMs ?? 10000} className="font-mono tabular-nums" />
            </Field>
          </div>
          <Field label="Keyword" htmlFor="keyword" hint="Optional. The response body must contain it.">
            <Input id="keyword" name="keyword" defaultValue={monitor?.keyword} />
          </Field>
          <div className="mt-auto flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : monitor ? "Save changes" : "Add monitor"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
