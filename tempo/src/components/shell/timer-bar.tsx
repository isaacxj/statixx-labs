"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Square } from "lucide-react";
import { startTimerAction, stopTimerAction } from "@/app/timer-actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { elapsedSeconds, formatClock } from "@/lib/timer";

export type TimerProject = { id: number; name: string; clientName: string; color: string };
export type RunningTimer = { id: number; projectId: number; description: string; startedAt: string; idleLimitMinutes: number };

export function TimerBar({ projects, running }: { projects: TimerProject[]; running: RunningTimer | null }) {
  const [projectId, setProjectId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!running) {
      document.title = "Tempo";
      return;
    }
    const tick = () => {
      const t = Date.now();
      setNow(t);
      document.title = `${formatClock(elapsedSeconds(running.startedAt, t))} · Tempo`;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      document.title = "Tempo";
    };
  }, [running]);

  const runningProject = running ? projects.find((p) => p.id === running.projectId) : null;

  if (running) {
    const clock = now === null ? "0:00:00" : formatClock(elapsedSeconds(running.startedAt, now));
    return (
      <div className="bg-card flex h-9 min-w-0 flex-1 items-center gap-2 rounded-input border pr-1 pl-3 sm:max-w-xl max-md:h-11" role="timer" aria-label="Running timer">
        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: runningProject?.color }} />
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium">{runningProject?.name ?? "Project"}</span>
          {running.description ? <span className="text-muted-foreground"> · {running.description}</span> : null}
        </span>
        <span className="tabular text-sm">{clock}</span>
        <Button size="icon" variant="ghost" disabled={pending} aria-label="Stop timer" onClick={() => startTransition(() => stopTimerAction())}>
          <Square className="fill-current" />
        </Button>
      </div>
    );
  }

  function start() {
    const id = Number(projectId);
    if (!id) return;
    startTransition(async () => {
      await startTimerAction(id, description);
      setDescription("");
    });
  }

  return (
    <form
      className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
    >
      <Select aria-label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-40 shrink-0 max-sm:w-32">
        <option value="">Project…</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.clientName} · {p.name}
          </option>
        ))}
      </Select>
      <Input aria-label="What are you working on?" placeholder="What are you working on?" value={description} onChange={(e) => setDescription(e.target.value)} className="min-w-0 flex-1 max-sm:hidden" maxLength={200} />
      <Button type="submit" size="icon" disabled={pending || !projectId} aria-label="Start timer">
        <Play className="fill-current" />
      </Button>
    </form>
  );
}
