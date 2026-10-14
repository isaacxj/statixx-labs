"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { saveStatusPage, type StatusPageState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, controlClass } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type StatusPageValues = { id: number; title: string; slug: string; accent: string; introMd: string };

export function StatusPageForm({ page, onDone }: { page?: StatusPageValues; onDone?: () => void }) {
  const router = useRouter();
  const [accent, setAccent] = useState(page?.accent ?? "#f43f5e");
  const [state, action, pending] = useActionState<StatusPageState, FormData>(async (prev, form) => {
    const result = await saveStatusPage(page?.id ?? null, prev, form);
    if (result?.ok) {
      toast.success(result.message);
      onDone?.();
      if (!page && result.id) router.push(`/status-pages/${result.id}`);
    }
    return result;
  }, null);
  const err = state?.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <Field label="Title" htmlFor="title" error={err.title}>
        <Input id="title" name="title" defaultValue={page?.title} autoFocus={!page} placeholder="Northwind Dental status" />
      </Field>
      <Field label="Address" htmlFor="slug" error={err.slug} hint="Public at /s/address. Leave blank to use the title.">
        <Input id="slug" name="slug" defaultValue={page?.slug} placeholder="northwind-dental" className="font-mono" autoCapitalize="none" />
      </Field>
      <Field label="Accent color" htmlFor="accent" error={err.accent}>
        <div className="flex items-center gap-2">
          <input
            id="accent"
            name="accent"
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className={cn(controlClass, "w-14 cursor-pointer p-1")}
          />
          <span className="text-muted-foreground font-mono text-sm tabular-nums">{accent}</span>
        </div>
      </Field>
      <Field label="Intro" htmlFor="introMd" error={err.introMd} hint="Optional. Shown under the title on the public page.">
        <textarea id="introMd" name="introMd" rows={3} defaultValue={page?.introMd} className={cn(controlClass, "h-auto py-2")} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : page ? "Save branding" : "Create page"}</Button>
      </div>
    </form>
  );
}

export function NewStatusPageSheet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus aria-hidden /> New status page
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div>
          <SheetTitle>New status page</SheetTitle>
          <SheetDescription>Next you&apos;ll choose which monitors appear on it.</SheetDescription>
        </div>
        <StatusPageForm onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
