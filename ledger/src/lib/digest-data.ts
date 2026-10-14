import { addDays } from "./dates";
import { DUE_SOON_DAYS, type DigestData, type DigestInvoice } from "./digest";

type Row = {
  id: number;
  number: string;
  client_name: string;
  business_name: string;
  currency: "USD" | "CAD";
  due_date: string;
  balance_cents: number;
};

const COLUMNS = `i.id, i.number, c.name AS client_name, b.name AS business_name, i.currency, i.due_date,
  i.total_cents - i.paid_cents AS balance_cents`;
const FROM = `FROM invoices i JOIN clients c ON c.id = i.client_id JOIN businesses b ON b.id = i.business_id`;
const OPEN = `i.status IN ('sent', 'viewed', 'partially_paid', 'overdue')`;

const toInvoice = (r: Row): DigestInvoice => ({
  id: r.id,
  number: r.number,
  clientName: r.client_name,
  businessName: r.business_name,
  currency: r.currency,
  dueDate: r.due_date,
  balanceCents: r.balance_cents,
});

/**
 * What the morning digest lists, from a raw D1 binding so the app and the jobs Worker share it.
 * `sinceUtc` ("YYYY-MM-DD HH:MM:SS") bounds which retainer invoices count as new.
 */
export async function loadDigestData(db: D1Database, today: string, sinceUtc: string): Promise<DigestData> {
  const run = async (where: string, ...binds: string[]) =>
    (await db.prepare(`SELECT ${COLUMNS} ${FROM} WHERE ${where}`).bind(...binds).all<Row>()).results.map(toInvoice);
  const [overdue, dueSoon, newRetainer] = await Promise.all([
    run(`${OPEN} AND i.due_date < ?1 ORDER BY i.due_date, i.number`, today),
    run(`${OPEN} AND i.due_date >= ?1 AND i.due_date <= ?2 ORDER BY i.due_date, i.number`, today, addDays(today, DUE_SOON_DAYS)),
    run(`i.retainer_id IS NOT NULL AND i.status != 'void' AND i.created_at >= ?1 ORDER BY i.created_at, i.number`, sinceUtc),
  ]);
  return { overdue, dueSoon, newRetainer };
}

/** The cutoff for "new" retainer invoices: the 24 hours before `now`, as a D1 UTC timestamp. */
export function digestSince(now = new Date()): string {
  return new Date(now.getTime() - 86_400_000).toISOString().slice(0, 19).replace("T", " ");
}
