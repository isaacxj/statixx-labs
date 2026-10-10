import type { InvoiceStatus } from "@/server/db/schema";

export const STATUS_TABS = ["all", "draft", "sent", "paid", "overdue", "void"] as const;
export type StatusTab = (typeof STATUS_TABS)[number];

export const TAB_LABELS: Record<StatusTab, string> = {
  all: "All",
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

/** Statuses an invoice can have while sitting under each tab. "Sent" covers everything issued but not settled. */
const TAB_STATUSES: Record<StatusTab, readonly InvoiceStatus[] | null> = {
  all: null,
  draft: ["draft"],
  sent: ["sent", "viewed", "partially_paid"],
  paid: ["paid"],
  overdue: ["overdue"],
  void: ["void"],
};

export function parseTab(raw: string | undefined): StatusTab {
  return (STATUS_TABS as readonly string[]).includes(raw ?? "") ? (raw as StatusTab) : "all";
}

export function tabStatuses(tab: StatusTab): readonly InvoiceStatus[] | null {
  return TAB_STATUSES[tab];
}

export const canSend = (s: InvoiceStatus) => s === "draft";
/** Anything with no money received can be voided; paid money must be handled before voiding. */
export const canVoid = (s: InvoiceStatus, paidCents: number) => s !== "void" && s !== "paid" && paidCents === 0;

export const statusLabel = (s: InvoiceStatus) => s.replace("_", " ");

export function statusTone(s: InvoiceStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (s) {
    case "paid":
      return "success";
    case "overdue":
      return "danger";
    case "partially_paid":
      return "warning";
    case "draft":
    case "void":
      return "neutral";
    default:
      return "info";
  }
}
