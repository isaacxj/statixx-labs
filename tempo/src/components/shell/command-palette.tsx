"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Play, Search, Square } from "lucide-react";
import { startTimerAction, stopTimerAction } from "@/app/timer-actions";
import { Button } from "@/components/ui/button";
import { isPaletteKey, isTimerKey, isTypingTarget, timerToggleAction } from "@/lib/shortcuts";
import { NAV_ITEMS } from "./nav";
import type { RunningTimer, TimerProject } from "./timer-bar";

const LAST_KEY = "tempo-last-project";

function readLast(): number | null {
  try {
    const n = Number(localStorage.getItem(LAST_KEY));
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeLast(id: number) {
  try {
    localStorage.setItem(LAST_KEY, String(id));
  } catch {}
}

export function CommandPalette({ projects, running }: { projects: TimerProject[]; running: RunningTimer | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const start = useCallback(
    (projectId: number) => {
      writeLast(projectId);
      setOpen(false);
      startTransition(() => startTimerAction(projectId, ""));
    },
    [startTransition],
  );

  const stop = useCallback(() => {
    if (running) writeLast(running.projectId);
    setOpen(false);
    startTransition(() => stopTimerAction());
  }, [running, startTransition]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isPaletteKey(e)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (!isTimerKey(e) || e.repeat || isTypingTarget(e.target as HTMLElement | null)) return;
      if (document.querySelector("[role=dialog]")) return;
      e.preventDefault();
      const action = timerToggleAction(running !== null, readLast(), projects.map((p) => p.id));
      if (action.type === "stop") stop();
      else if (action.type === "start") start(action.projectId);
      else setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, projects, start, stop]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="text-muted-foreground max-md:size-11 max-md:p-0" onClick={() => setOpen(true)} aria-label="Open command palette">
        <Search />
        <span className="max-md:hidden">Search</span>
        <kbd className="tabular bg-muted rounded-input border px-1.5 text-xs max-md:hidden">⌘K</kbd>
      </Button>
      <Command.Dialog open={open} onOpenChange={setOpen} label="Command palette" overlayClassName="bg-foreground/40 fixed inset-0 z-40" contentClassName="bg-popover text-popover-foreground rounded-sheet fixed top-[15vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 border shadow-overlay">
        <Command.Input placeholder="Type a command or search…" className="h-12 w-full border-b bg-transparent px-4 text-base outline-none" />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="text-muted-foreground p-4 text-center text-sm">Nothing matches.</Command.Empty>
          <Command.Group heading="Timer" className="text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs">
            {running ? (
              <Item onSelect={stop} icon={<Square className="size-4 fill-current" />}>
                Stop timer
              </Item>
            ) : null}
            {projects.map((p) => (
              <Item key={p.id} value={`start ${p.clientName} ${p.name}`} onSelect={() => start(p.id)} icon={<Play className="size-4 fill-current" />}>
                {running ? "Switch to" : "Start"} {p.clientName} · {p.name}
              </Item>
            ))}
          </Command.Group>
          <Command.Group heading="Go to" className="text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Item key={href} value={`go ${label}`} onSelect={() => go(href)} icon={<Icon className="size-4" />}>
                {label}
              </Item>
            ))}
          </Command.Group>
        </Command.List>
        <p className="text-muted-foreground border-t px-4 py-2 text-xs">
          Press <kbd className="bg-muted rounded-input border px-1">T</kbd> anywhere to start or stop the timer.
        </p>
      </Command.Dialog>
    </>
  );
}

function Item({ icon, children, ...props }: { icon: React.ReactNode; children: React.ReactNode; value?: string; onSelect: () => void }) {
  return (
    <Command.Item {...props} className="text-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground flex min-h-9 cursor-pointer items-center gap-3 rounded-input px-2 text-sm max-md:min-h-11">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{children}</span>
    </Command.Item>
  );
}
