import type { MonitorStatus } from "@/server/db/schema";

export const STATUS_LABELS: Record<MonitorStatus, string> = {
  pending: "Pending",
  up: "Up",
  down: "Down",
  paused: "Paused",
};

export function formatLatency(ms: number | null): string {
  if (ms === null) return "–";
  return `${Math.round(ms)} ms`;
}

export function formatInterval(sec: number): string {
  if (sec % 60 === 0) return `Every ${sec / 60} min`;
  return `Every ${sec} s`;
}

export function formatCheckedAt(utc: string | null): string {
  if (!utc) return "Not checked yet";
  const d = new Date(utc.includes("T") ? utc : `${utc.replace(" ", "T")}Z`);
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}
