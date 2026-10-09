import { counts, lineTotal, proposalTotals, type PricedItem } from "./pricing";

/** Text that a spreadsheet would run as a formula gets a leading apostrophe. */
function guard(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export type Cell = string | number | null;

function cell(value: Cell): string {
  if (value === null) return "";
  const text = typeof value === "number" ? String(value) : guard(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 rows with CRLF endings and a BOM so Excel reads UTF-8. */
export function toCsv(header: string[], rows: Cell[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

export const money = (cents: number) => (cents / 100).toFixed(2);

export type ExportProposal = {
  id: number;
  number: string;
  title: string;
  status: string;
  currency: string;
  clientName: string;
  clientCompany: string;
  businessName: string;
  discountBp: number;
  taxRateBp: number;
  validUntil: string | null;
  sentAt: string | null;
  firstViewedAt: string | null;
  viewCount: number;
  acceptedAt: string | null;
  acceptedByName: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  items: PricedItem[];
};

export type ExportLine = PricedItem & {
  proposalId: number;
  sectionTitle: string;
  description: string;
};

export const PROPOSAL_HEADER = [
  "Number", "Title", "Status", "Client", "Company", "Business", "Currency", "Valid until", "Sent", "First viewed",
  "Views", "Accepted", "Accepted by", "Declined", "Decline reason", "Discount %", "Tax %",
  "One-time total", "Monthly total",
];

export function proposalRows(list: ExportProposal[]): Cell[][] {
  return list.map((p) => {
    const t = proposalTotals(p.items, p.discountBp, p.taxRateBp);
    return [
      p.number, p.title, p.status, p.clientName, p.clientCompany, p.businessName, p.currency, p.validUntil, p.sentAt,
      p.firstViewedAt, p.viewCount, p.acceptedAt, p.acceptedByName, p.declinedAt, p.declineReason,
      (p.discountBp / 100).toFixed(2), (p.taxRateBp / 100).toFixed(2), money(t.oneTime.total), money(t.monthly.total),
    ];
  });
}

export const LINE_HEADER = [
  "Proposal", "Title", "Section", "Description", "Quantity", "Unit price", "Billing", "Optional", "Included", "Line total",
];

export function lineRows(list: ExportProposal[], lines: ExportLine[]): Cell[][] {
  const byId = new Map(list.map((p) => [p.id, p]));
  return lines.flatMap((l) => {
    const p = byId.get(l.proposalId);
    if (!p) return [];
    return [[
      p.number, p.title, l.sectionTitle, l.description, String(l.qtyMilli / 1000), money(l.unitPriceCents),
      l.recurring === "monthly" ? "Monthly" : "One-time", l.optional ? "Yes" : "No", counts(l) ? "Yes" : "No",
      money(lineTotal(l)),
    ]];
  });
}
