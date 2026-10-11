"use client";

import { startTransition, useActionState, useState } from "react";
import { Pencil, Play, Scissors, Trash2 } from "lucide-react";
import {
  deleteEntryAction,
  restartEntryAction,
  splitEntryAction,
  updateEntryAction,
  type EntryFormState,
} from "@/app/today/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { localDay, localTime } from "@/lib/entries";
import { formatDuration } from "@/lib/format";

type Option = { id: number; name: string; clientName: string };
export type EntryRowData = {
  id: number;
  projectId: number;
  projectName: string;
  clientName: string;
  color: string;
  description: string;
  startedAt: string;
  endedAt: string;
  minutes: number;
  billable: boolean;
  billedAt: string | null;
};

function toClock(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
  return parts;
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="text-danger text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function EntryRow({ entry: en, projects }: { entry: EntryRowData; projects: Option[] }) {
  const [mode, setMode] = useState<"view" | "edit" | "split">("view");
  const [editState, editAction, editPending] = useActionState<EntryFormState, FormData>(async (prev, data) => {
    const next = await updateEntryAction(en.id, prev, data);
    if (next && Object.keys(next.errors).length === 0) setMode("view");
    return next;
  }, null);
  const [splitState, splitAction, splitPending] = useActionState<EntryFormState, FormData>(async (prev, data) => {
    const next = await splitEntryAction(en.id, prev, data);
    if (next && Object.keys(next.errors).length === 0) setMode("view");
    return next;
  }, null);
  const label = en.description || en.projectName;
  const locked = en.billedAt !== null;
  const ee = editState?.errors ?? {};

  const submit = (action: (d: FormData) => void) => (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    startTransition(() => action(data));
  };

  if (mode === "edit") {
    return (
      <li className="px-4 py-4">
        <form onSubmit={submit(editAction)} className="grid gap-4 sm:grid-cols-2" aria-label={`Edit ${label}`}>
          <Field label="Project" id={`p-${en.id}`} error={ee.projectId}>
            <Select id={`p-${en.id}`} name="projectId" defaultValue={String(en.projectId)} required>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" id={`d-${en.id}`}>
            <Input id={`d-${en.id}`} name="description" maxLength={200} defaultValue={en.description} />
          </Field>
          <Field label="Date" id={`day-${en.id}`} error={ee.day}>
            <Input id={`day-${en.id}`} name="day" type="date" defaultValue={localDay(en.startedAt)} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start" id={`s-${en.id}`} error={ee.start}>
              <Input id={`s-${en.id}`} name="start" type="time" defaultValue={toClock(en.startedAt)} required />
            </Field>
            <Field label="Duration" id={`du-${en.id}`} error={ee.duration}>
              <Input id={`du-${en.id}`} name="duration" inputMode="decimal" defaultValue={formatDuration(en.minutes)} required />
            </Field>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={editPending}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("view")}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: en.color }} />
        <div className="flex min-w-0 flex-1 basis-40 flex-col">
          <span className="truncate font-medium">{label}</span>
          <span className="text-muted-foreground truncate text-xs">
            {en.description && `${en.projectName} · `}
            {en.clientName} · {localTime(en.startedAt)}–{localTime(en.endedAt)}
            {!en.billable && " · non-billable"}
            {locked && " · billed"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1 max-sm:w-full max-sm:justify-end">
        <span className="mr-2 font-mono text-sm tabular-nums">{formatDuration(en.minutes)}</span>
        <form action={restartEntryAction.bind(null, en.id)}>
          <Button variant="ghost" size="icon" type="submit" aria-label={`Restart ${label}`}>
            <Play />
          </Button>
        </form>
        {!locked && (
          <>
            <Button variant="ghost" size="icon" aria-label={`Edit ${label}`} onClick={() => setMode("edit")}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Split ${label}`} disabled={en.minutes < 2} onClick={() => setMode(mode === "split" ? "view" : "split")}>
              <Scissors />
            </Button>
            <form action={deleteEntryAction.bind(null, en.id)}>
              <Button variant="ghost" size="icon" type="submit" aria-label={`Delete ${label}`}>
                <Trash2 />
              </Button>
            </form>
          </>
        )}
        </div>
      </div>
      {mode === "split" && (
        <form onSubmit={submit(splitAction)} className="mt-3 flex flex-wrap items-end gap-3" aria-label={`Split ${label}`}>
          <Field label={`First part (of ${formatDuration(en.minutes)})`} id={`f-${en.id}`} error={splitState?.errors.first}>
            <Input id={`f-${en.id}`} name="first" inputMode="decimal" placeholder="0:30" required className="w-32" />
          </Field>
          <Button type="submit" disabled={splitPending}>
            Split
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMode("view")}>
            Cancel
          </Button>
        </form>
      )}
    </li>
  );
}
