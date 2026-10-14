import { todayChicago } from "../../../src/lib/dates";
import { dueRuns, invoiceFor, parseItems } from "./plan";

type RetainerJoin = {
  id: number;
  business_id: number;
  client_id: number;
  title: string;
  cadence: "monthly" | "quarterly";
  anchor_day: number;
  starts_on: string;
  ends_on: string | null;
  next_run_on: string;
  items_json: string;
  terms_days: number;
  currency: string;
};

function token(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Creates the invoice for one retainer run, already sent. Everything is guarded by the unique
 * (retainer_id, issue_date) index and NOT EXISTS checks, so running it again changes nothing.
 */
async function createRunInvoice(db: D1Database, r: RetainerJoin, runOn: string, nextRunOn: string | null) {
  const items = parseItems(r.items_json);
  const inv = invoiceFor(items, runOn, r.terms_days);
  const where = `retainer_id = ?1 AND issue_date = ?2`;
  await db.batch([
    db
      .prepare(
        `INSERT INTO invoices (business_id, client_id, retainer_id, number, status, issue_date, due_date, currency,
           subtotal_cents, tax_cents, total_cents, share_token, sent_at)
         SELECT b.id, ?3, ?1, b.number_prefix || '-' || printf('%04d', b.next_number), 'sent', ?2, ?4, b.currency,
           ?5, ?6, ?7, ?8, datetime('now')
         FROM businesses b WHERE b.id = ?9
         ON CONFLICT DO NOTHING`,
      )
      .bind(r.id, runOn, r.client_id, inv.dueDate, inv.subtotalCents, inv.taxCents, inv.totalCents, token(), r.business_id),
    db
      .prepare(
        `INSERT INTO invoice_items (invoice_id, position, description, qty_milli, unit_price_cents, tax_rate_bp)
         SELECT i.id, j.key, json_extract(j.value, '$.description'), json_extract(j.value, '$.qtyMilli'),
           json_extract(j.value, '$.unitPriceCents'), json_extract(j.value, '$.taxRateBp')
         FROM invoices i, json_each(?3) j
         WHERE i.${where} AND NOT EXISTS (SELECT 1 FROM invoice_items WHERE invoice_id = i.id)`,
      )
      .bind(r.id, runOn, JSON.stringify(items)),
    ...(["created", "sent"] as const).map((type) =>
      db
        .prepare(
          `INSERT INTO events (invoice_id, type, meta_json) SELECT i.id, '${type}', '{"retainerId":' || ?1 || '}'
           FROM invoices i WHERE i.${where} AND NOT EXISTS (SELECT 1 FROM events WHERE invoice_id = i.id AND type = '${type}')`,
        )
        .bind(r.id, runOn),
    ),
    // Move the business past a number only once an invoice holds it.
    db
      .prepare(
        `UPDATE businesses SET next_number = next_number + 1, updated_at = datetime('now')
         WHERE id = ?1 AND EXISTS (SELECT 1 FROM invoices WHERE business_id = businesses.id
           AND number = businesses.number_prefix || '-' || printf('%04d', businesses.next_number))`,
      )
      .bind(r.business_id),
    db
      .prepare(`UPDATE retainers SET next_run_on = ?2, updated_at = datetime('now') WHERE id = ?1`)
      .bind(r.id, nextRunOn),
  ]);
}

/** Retainers whose run date has arrived get their invoices. Returns how many runs were processed. */
export async function createRetainerInvoices(db: D1Database, today: string): Promise<number> {
  const { results } = await db
    .prepare(
      `SELECT r.id, r.business_id, r.client_id, r.title, r.cadence, r.anchor_day, r.starts_on, r.ends_on, r.next_run_on,
         r.items_json, b.terms_days, b.currency
       FROM retainers r JOIN businesses b ON b.id = r.business_id
       WHERE r.active = 1 AND r.next_run_on IS NOT NULL AND r.next_run_on <= ?1`,
    )
    .bind(today)
    .all<RetainerJoin>();
  let runs = 0;
  for (const r of results) {
    const { due } = dueRuns(
      { cadence: r.cadence, anchorDay: r.anchor_day, startsOn: r.starts_on, endsOn: r.ends_on, nextRunOn: r.next_run_on },
      today,
    );
    for (const [i, runOn] of due.entries()) {
      const after = due[i + 1] ?? dueRuns({ cadence: r.cadence, anchorDay: r.anchor_day, startsOn: r.starts_on, endsOn: r.ends_on, nextRunOn: runOn }, runOn).nextRunOn;
      try {
        await createRunInvoice(db, r, runOn, after);
        runs++;
      } catch (err) {
        console.error(`retainer ${r.id} run ${runOn} failed`, err);
        break;
      }
    }
  }
  return runs;
}

/** Issued invoices past their due date become overdue, each with one event. Returns the count. */
export async function markOverdue(db: D1Database, today: string): Promise<number> {
  const guard = `status IN ('sent', 'viewed', 'partially_paid') AND due_date < ?1`;
  const [, update] = await db.batch([
    db.prepare(`INSERT INTO events (invoice_id, type) SELECT id, 'overdue' FROM invoices WHERE ${guard}`).bind(today),
    db.prepare(`UPDATE invoices SET status = 'overdue', updated_at = datetime('now') WHERE ${guard}`).bind(today),
  ]);
  return update.meta.changes;
}

export async function runJobs(db: D1Database, now = new Date()) {
  const today = todayChicago(now);
  const created = await createRetainerInvoices(db, today);
  const overdue = await markOverdue(db, today);
  console.log(`jobs ${today}: ${created} retainer invoices created, ${overdue} marked overdue`);
  return { today, created, overdue };
}
