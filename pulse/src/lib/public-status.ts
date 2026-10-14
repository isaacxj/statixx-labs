import type { MonitorStatus } from "@/server/db/schema";
import type { StatusKind } from "@/components/status-badge";

export type OverallStatus = "operational" | "partial" | "major";

export const DEFAULT_ACCENT = "#f43f5e";

/** Page accents are user data; only a plain hex color ever reaches a style attribute. */
export function safeAccent(accent: string): string {
  return /^#[0-9a-f]{6}$/i.test(accent) ? accent : DEFAULT_ACCENT;
}

export function componentKind(status: MonitorStatus): StatusKind {
  return status;
}

/** Pending and paused monitors are left out: only monitors that are actually checked count. */
export function overallStatus(statuses: MonitorStatus[]): OverallStatus {
  const live = statuses.filter((s) => s === "up" || s === "down");
  const down = live.filter((s) => s === "down").length;
  if (down === 0) return "operational";
  return down === live.length ? "major" : "partial";
}

export const OVERALL_COPY: Record<OverallStatus, { label: string; kind: StatusKind }> = {
  operational: { label: "All systems operational", kind: "up" },
  partial: { label: "Partial outage", kind: "degraded" },
  major: { label: "Major outage", kind: "down" },
};

/** Automatic incident titles carry internal monitor names and raw errors, so the public page words them from the display name. */
export function publicIncidentTitle(incident: { title: string; auto: boolean }, displayName: string): string {
  return incident.auto ? `${displayName} is unavailable` : incident.title;
}
