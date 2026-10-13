"use client";

import { useTransition } from "react";
import { Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeMonitor, togglePause } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { MonitorSheet, type MonitorFormValues } from "./monitor-sheet";

export function MonitorActions({ monitor, paused }: { monitor: MonitorFormValues; paused: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-1">
      <MonitorSheet
        monitor={monitor}
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Edit ${monitor.name}`}>
            <Pencil />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label={`${paused ? "Resume" : "Pause"} ${monitor.name}`}
        onClick={() => start(async () => { await togglePause(monitor.id, !paused); toast.success(paused ? `Resumed ${monitor.name}` : `Paused ${monitor.name}`); })}
      >
        {paused ? <Play /> : <Pause />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label={`Delete ${monitor.name}`}
        onClick={() => {
          if (!confirm(`Delete ${monitor.name} and its check history?`)) return;
          start(async () => { await removeMonitor(monitor.id); toast.success(`Deleted ${monitor.name}`); });
        }}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
