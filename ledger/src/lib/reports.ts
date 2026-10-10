import type { CurrencyCode } from "./money";

export type ReportInvoice = {
  currency: CurrencyCode;
  issueDate: string;
  businessName: string;
  clientName: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

export type Slice = { label: string; totalCents: number; count: number };
export type CurrencyReport = {
  currency: CurrencyCode;
  totalCents: number;
  taxCents: number;
  count: number;
  /** Twelve entries, January to December; label is the short month name. */
  months: Slice[];
  clients: Slice[];
  businesses: Slice[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function addTo(map: Map<string, Slice>, label: string, cents: number) {
  const s = map.get(label) ?? { label, totalCents: 0, count: 0 };
  s.totalCents += cents;
  s.count += 1;
  map.set(label, s);
}

const byTotal = (a: Slice, b: Slice) => b.totalCents - a.totalCents || a.label.localeCompare(b.label);

/**
 * Revenue is the total of issued invoices (sent, viewed, paid, overdue; never draft or void),
 * grouped by issue date. Currencies are never mixed, so there is one report per currency.
 */
export function buildReports(invoices: ReportInvoice[], year: number): CurrencyReport[] {
  const prefix = `${year}-`;
  const out = new Map<CurrencyCode, CurrencyReport & { c: Map<string, Slice>; b: Map<string, Slice> }>();
  for (const i of invoices) {
    if (!i.issueDate.startsWith(prefix)) continue;
    let r = out.get(i.currency);
    if (!r) {
      r = {
        currency: i.currency,
        totalCents: 0,
        taxCents: 0,
        count: 0,
        months: MONTHS.map((label) => ({ label, totalCents: 0, count: 0 })),
        clients: [],
        businesses: [],
        c: new Map(),
        b: new Map(),
      };
      out.set(i.currency, r);
    }
    const month = r.months[Number(i.issueDate.slice(5, 7)) - 1];
    month.totalCents += i.totalCents;
    month.count += 1;
    r.totalCents += i.totalCents;
    r.taxCents += i.taxCents;
    r.count += 1;
    addTo(r.c, i.clientName, i.totalCents);
    addTo(r.b, i.businessName, i.totalCents);
  }
  return [...out.values()]
    .map(({ c, b, ...r }) => ({ ...r, clients: [...c.values()].sort(byTotal), businesses: [...b.values()].sort(byTotal) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

/** Years that have issued invoices, newest first, always including `current`. */
export function reportYears(issueDates: string[], current: number): number[] {
  const years = new Set([current, ...issueDates.map((d) => Number(d.slice(0, 4)))]);
  return [...years].sort((a, b) => b - a);
}

/** Reads `?year=` safely; anything unusable falls back to the current year. */
export function parseYear(value: string | undefined, current: number): number {
  const n = value && /^\d{4}$/.test(value) ? Number(value) : NaN;
  return n >= 2000 && n <= 2100 ? n : current;
}
