export type PaletteItem = {
  id: string;
  group: "Actions" | "Pages" | "Invoices" | "Clients";
  label: string;
  /** Extra words that match the query but are not shown. */
  hint?: string;
  href?: string;
  /** Selector of an on-page control to click instead of navigating. */
  click?: string;
  shortcut?: string;
};

export const GROUP_ORDER: PaletteItem["group"][] = ["Actions", "Pages", "Invoices", "Clients"];

/** Lower is better; -1 means no match. Prefix beats word start beats substring. */
export function scoreItem(item: PaletteItem, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const label = item.label.toLowerCase();
  if (label.startsWith(q)) return 0;
  if (label.split(/[\s·-]+/).some((w) => w.startsWith(q))) return 1;
  if (label.includes(q)) return 2;
  if (item.hint?.toLowerCase().includes(q)) return 3;
  return -1;
}

export function filterItems(items: PaletteItem[], query: string, limit = 30): PaletteItem[] {
  const scored = items
    .map((item, order) => ({ item, order, score: scoreItem(item, query) }))
    .filter((s) => s.score >= 0)
    .sort((a, b) => a.score - b.score || GROUP_ORDER.indexOf(a.item.group) - GROUP_ORDER.indexOf(b.item.group) || a.order - b.order);
  return scored.slice(0, limit).map((s) => s.item);
}

/** True when a key press is going into a field, so single-key shortcuts must stay out of the way. */
export function isTypingTarget(el: { tagName?: string; isContentEditable?: boolean } | null): boolean {
  if (!el?.tagName) return false;
  return el.isContentEditable === true || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export const GO_KEYS: Record<string, string> = {
  d: "/",
  i: "/invoices",
  r: "/retainers",
  p: "/reports",
  c: "/clients",
  s: "/settings",
};

export const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "⌘K / Ctrl K", label: "Open the command palette" },
  { keys: "?", label: "Show this list" },
  { keys: "C", label: "New invoice" },
  { keys: "S", label: "Mark the open invoice as sent" },
  { keys: "P", label: "Record a payment on the open invoice" },
  { keys: "G then D", label: "Go to Dashboard" },
  { keys: "G then I", label: "Go to Invoices" },
  { keys: "G then R", label: "Go to Retainers" },
  { keys: "G then P", label: "Go to Reports" },
  { keys: "G then C", label: "Go to Clients" },
  { keys: "G then S", label: "Go to Settings" },
  { keys: "Esc", label: "Close a dialog or sheet" },
];
