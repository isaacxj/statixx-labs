"use client";

import { useEffect, useState, useTransition } from "react";
import { TriangleAlert } from "lucide-react";
import { resolveIdleTimerAction } from "@/app/timer-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatDuration } from "@/lib/format";
import { idleStatus } from "@/lib/idle";
import type { RunningTimer } from "./timer-bar";

const keptKey = (id: number) => `tempo-idle-kept-${id}`;

/** Asks what to do with a timer that has run past the business's idle limit. */
export function IdleGuard({ running }: { running: RunningTimer | null }) {
  const [now, setNow] = useState<number | null>(null);
  const [kept, setKept] = useState(false);
  const [keep, setKeep] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!running) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading sessionStorage after mount
      setKept(sessionStorage.getItem(keptKey(running.id)) === "1");
    } catch {}
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [running]);

  if (!running || now === null || kept) return null;
  const { over, elapsedMinutes, limitMinutes } = idleStatus(running.startedAt, now, running.idleLimitMinutes);
  if (!over) return null;
  const keepValue = keep ?? String(limitMinutes);

  function keepAll() {
    try {
      sessionStorage.setItem(keptKey(running!.id), "1");
    } catch {}
    setKept(true);
  }

  return (
    <div role="alert" className="bg-warning/10 border-warning/40 flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-center">
      <p className="flex min-w-0 flex-1 items-start gap-2 text-sm">
        <TriangleAlert aria-hidden className="text-warning mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-medium">This timer has been running for {formatDuration(elapsedMinutes)} hours.</span> Still working, or did you
          forget to stop it?
        </span>
      </p>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(() => resolveIdleTimerAction(running.id, "trim", keepValue));
        }}
      >
        <Label htmlFor="idle-keep" className="text-muted-foreground">
          Keep minutes
        </Label>
        <Input
          id="idle-keep"
          type="number"
          min={0}
          max={elapsedMinutes}
          inputMode="numeric"
          value={keepValue}
          onChange={(e) => setKeep(e.target.value)}
          className="w-24"
        />
        <Button type="submit" size="sm" disabled={pending}>
          Trim and stop
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={keepAll}>
          Keep running
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(() => resolveIdleTimerAction(running.id, "discard", ""))}>
          Discard
        </Button>
      </form>
    </div>
  );
}
