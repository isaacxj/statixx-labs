import type { EventType } from "@/server/db/schema";

/** A view counts only for the client: not by the signed-in team, not on a draft, not once recorded. */
export function shouldRecordView({
  status,
  viewedAt,
  isTeam,
}: {
  status: string;
  viewedAt: string | null;
  isTeam: boolean;
}): boolean {
  return !isTeam && !viewedAt && status !== "draft";
}

export function eventLabel(type: EventType, meta: { amountText?: string } = {}): string {
  switch (type) {
    case "created":
      return "Draft created";
    case "sent":
      return "Marked as sent";
    case "viewed":
      return "Client opened the invoice";
    case "payment":
      return meta.amountText ? `Payment of ${meta.amountText} recorded` : "Payment recorded";
    case "overdue":
      return "Marked overdue";
    case "voided":
      return "Voided";
  }
}

/** D1 stores UTC as "YYYY-MM-DD HH:MM:SS"; shown in America/Chicago. */
export function formatEventTime(at: string): string {
  const d = new Date(`${at.replace(" ", "T")}Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
