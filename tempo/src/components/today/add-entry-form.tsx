"use client";

import { startTransition, useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { addEntry, type EntryFormState } from "@/app/today/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

type Option = { id: number; name: string; clientName: string };

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

export function AddEntryForm({ projects, today }: { projects: Option[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<EntryFormState, FormData>(async (prev, data) => {
    const next = await addEntry(prev, data);
    if (next && Object.keys(next.errors).length === 0) setOpen(false);
    return next;
  }, null);
  const e = state?.errors ?? {};

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus /> Add time
      </Button>
    );
  }
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      className="bg-card rounded-card grid gap-4 border p-4 sm:grid-cols-2">
      <Field label="Project" id="projectId" error={e.projectId}>
        <Select id="projectId" name="projectId" defaultValue="" required>
          <option value="" disabled>
            Select a project
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.clientName})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Description" id="description">
        <Input id="description" name="description" maxLength={200} placeholder="What did you work on?" />
      </Field>
      <Field label="Date" id="day" error={e.day}>
        <Input id="day" name="day" type="date" defaultValue={today} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start" id="start" error={e.start}>
          <Input id="start" name="start" type="time" defaultValue="09:00" required />
        </Field>
        <Field label="Duration" id="duration" error={e.duration}>
          <Input id="duration" name="duration" placeholder="1:30" inputMode="decimal" required />
        </Field>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          Add entry
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
