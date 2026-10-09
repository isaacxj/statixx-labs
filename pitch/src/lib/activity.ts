import type { EventType } from "@/server/db/schema";

/** True when the request comes from a signed-in team member (Access header or session cookie), whose views are not counted. */
export function isTeamRequest(headers: { get(name: string): string | null }): boolean {
  if (headers.get("cf-access-authenticated-user-email")) return true;
  return /(?:^|;\s*)CF_Authorization=/.test(headers.get("cookie") ?? "");
}

/** What a first or repeat view does to a proposal's status: a sent proposal becomes viewed, everything else stays. */
export function statusAfterView<S extends string>(status: S): S | "viewed" {
  return status === "sent" ? "viewed" : status;
}

const LABELS: Record<EventType, string> = {
  created: "Created",
  edited: "Edited",
  sent: "Sent to client",
  viewed: "Opened by client",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

export function describeEvent(type: EventType, metaJson: string | null): string {
  if (type === "viewed" && metaJson) {
    try {
      const n = (JSON.parse(metaJson) as { n?: unknown }).n;
      if (typeof n === "number" && n > 1) return `Opened by client (view ${n})`;
    } catch {
      // meta is optional detail only
    }
  }
  return LABELS[type];
}
