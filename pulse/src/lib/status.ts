import type { MonitorStatus } from "@/server/db/schema";

export const FAILURE_THRESHOLD = 2;

export type MonitorState = { status: MonitorStatus; consecutiveFailures: number };
export type StatusTransition = MonitorState & { incident: "open" | "resolve" | null };

// Down after FAILURE_THRESHOLD consecutive failures, up on the first success.
// A single blip never opens an incident.
export function nextMonitorState(current: MonitorState, ok: boolean, threshold = FAILURE_THRESHOLD): StatusTransition {
  if (ok) {
    return { status: "up", consecutiveFailures: 0, incident: current.status === "down" ? "resolve" : null };
  }
  const consecutiveFailures = current.consecutiveFailures + 1;
  if (current.status === "down") return { status: "down", consecutiveFailures, incident: null };
  if (consecutiveFailures >= threshold) return { status: "down", consecutiveFailures, incident: "open" };
  // Still confirming: keep the last known status (pending stays pending).
  return { status: current.status, consecutiveFailures, incident: null };
}

export function incidentTitle(monitorName: string, error: string | null): string {
  return error ? `${monitorName} is down: ${error}` : `${monitorName} is down`;
}

export function formatDuration(startedAt: string, resolvedAt: string | null, nowMs = Date.now()): string {
  const toMs = (s: string) => new Date(`${s.replace(" ", "T")}Z`).getTime();
  const mins = Math.max(0, Math.round(((resolvedAt ? toMs(resolvedAt) : nowMs) - toMs(startedAt)) / 60000));
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return mins % 60 === 0 ? `${h} h` : `${h} h ${mins % 60} min`;
}
