import type { ProjectStatus } from "@/server/db/schema";

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
  done: "Done",
};

export const STATUS_TONES: Record<ProjectStatus, "success" | "warning" | "danger" | "neutral"> = {
  on_track: "success",
  at_risk: "warning",
  blocked: "danger",
  done: "neutral",
};

/** "2026-11-14" to "Nov 14, 2026", or an em dash when there is no date. */
export function formatDate(day: string | null): string {
  if (!day) return "—";
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${day}T12:00:00Z`));
}
