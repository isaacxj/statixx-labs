import { localDay } from "@/lib/entries";
import type { BillingType } from "@/server/db/schema";

export type UnbilledEntry = {
  id: number;
  startedAt: string;
  minutes: number;
  description: string;
  projectId: number;
  projectName: string;
  billing: BillingType;
  rateCents: number;
  clientId: number;
  clientName: string;
  currency: string;
};

export type UnbilledProject = { projectId: number; name: string; billing: BillingType; rateCents: number; minutes: number; amountCents: number | null };
export type UnbilledClient = {
  clientId: number;
  name: string;
  currency: string;
  minutes: number;
  /** Sum of hourly project amounts; fixed-fee and retainer time bills on the fee, not hours. */
  amountCents: number;
  maxEntryId: number;
  projects: UnbilledProject[];
};

/** Hourly lines are hours x rate, rounded to the cent per entry so the CSV lines add up to the page. */
export function lineAmountCents(e: Pick<UnbilledEntry, "billing" | "minutes" | "rateCents">): number | null {
  return e.billing === "hourly" ? Math.round((e.minutes * e.rateCents) / 60) : null;
}

/** Groups unbilled billable entries by client and project, biggest client first. */
export function groupUnbilled(entries: UnbilledEntry[]): UnbilledClient[] {
  const clients = new Map<number, UnbilledClient>();
  for (const e of entries) {
    const c = clients.get(e.clientId) ?? { clientId: e.clientId, name: e.clientName, currency: e.currency, minutes: 0, amountCents: 0, maxEntryId: 0, projects: [] };
    let p = c.projects.find((x) => x.projectId === e.projectId);
    if (!p) {
      p = { projectId: e.projectId, name: e.projectName, billing: e.billing, rateCents: e.rateCents, minutes: 0, amountCents: e.billing === "hourly" ? 0 : null };
      c.projects.push(p);
    }
    const amount = lineAmountCents(e);
    p.minutes += e.minutes;
    if (amount !== null) p.amountCents = (p.amountCents ?? 0) + amount;
    c.minutes += e.minutes;
    c.amountCents += amount ?? 0;
    c.maxEntryId = Math.max(c.maxEntryId, e.id);
    clients.set(e.clientId, c);
  }
  const out = [...clients.values()];
  for (const c of out) c.projects.sort((a, b) => a.name.localeCompare(b.name));
  return out.sort((a, b) => b.amountCents - a.amountCents || a.name.localeCompare(b.name));
}

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const money = (cents: number) => (cents / 100).toFixed(2);

/** One client's unbilled lines, ready to invoice, ending with a total row. */
export function unbilledCsv(entries: UnbilledEntry[]): string {
  const rows = [["Date", "Project", "Description", "Hours", "Rate", "Amount"]];
  let cents = 0;
  let minutes = 0;
  for (const e of entries) {
    const amount = lineAmountCents(e);
    cents += amount ?? 0;
    minutes += e.minutes;
    rows.push([localDay(e.startedAt), e.projectName, e.description, (e.minutes / 60).toFixed(2), amount === null ? "" : money(e.rateCents), amount === null ? "" : money(amount)]);
  }
  rows.push(["Total", "", "", (minutes / 60).toFixed(2), "", money(cents)]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** A filename-safe version of a client name. */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
}
