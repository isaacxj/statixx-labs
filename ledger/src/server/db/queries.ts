import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { computeTotals } from "@/lib/invoice-math";
import type { InvoiceInput } from "@/lib/invoice-form";
import { likePattern } from "@/lib/client-form";
import { addDays, todayChicago } from "@/lib/dates";
import type { PaymentInput } from "@/lib/payments";
import { canSend, canVoid, tabStatuses, type StatusTab } from "@/lib/invoice-status";
import type { RetainerInput } from "@/lib/retainer-form";
import { runDates } from "@/lib/retainer-schedule";
import { getD1, getDb } from "./index";
import { businesses, clients, events, invoiceItems, invoices, payments, retainers } from "./schema";

export async function listBusinesses() {
  return getDb().select().from(businesses).orderBy(asc(businesses.name));
}

export async function listClients() {
  return getDb().select().from(clients).orderBy(asc(clients.name));
}

export async function getBusiness(id: number) {
  const [row] = await getDb().select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return row ?? null;
}

type BusinessValues = Omit<typeof businesses.$inferInsert, "id" | "logoKey" | "nextNumber" | "createdAt" | "updatedAt">;

export async function createBusiness(values: BusinessValues) {
  const [row] = await getDb().insert(businesses).values(values).returning({ id: businesses.id });
  return row.id;
}

export async function updateBusiness(id: number, values: BusinessValues) {
  await getDb()
    .update(businesses)
    .set({ ...values, updatedAt: sql`(datetime('now'))` })
    .where(eq(businesses.id, id));
}

export async function setBusinessLogo(id: number, logoKey: string | null) {
  await getDb()
    .update(businesses)
    .set({ logoKey, updatedAt: sql`(datetime('now'))` })
    .where(eq(businesses.id, id));
}

export async function searchClients(q: string) {
  const query = getDb().select().from(clients);
  if (!q.trim()) return query.orderBy(asc(clients.name));
  const pattern = likePattern(q);
  const match = (col: typeof clients.name | typeof clients.company | typeof clients.email) =>
    sql`${col} LIKE ${pattern} ESCAPE '\\'`;
  return query.where(or(match(clients.name), match(clients.company), match(clients.email))).orderBy(asc(clients.name));
}

export async function getClient(id: number) {
  const [row] = await getDb().select().from(clients).where(eq(clients.id, id)).limit(1);
  return row ?? null;
}

type ClientValues = Omit<typeof clients.$inferInsert, "id" | "createdAt" | "updatedAt">;

export async function createClient(values: ClientValues) {
  const [row] = await getDb().insert(clients).values(values).returning({ id: clients.id });
  return row.id;
}

export async function updateClient(id: number, values: ClientValues) {
  await getDb()
    .update(clients)
    .set({ ...values, updatedAt: sql`(datetime('now'))` })
    .where(eq(clients.id, id));
}

function newShareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function itemRows(invoiceId: number, items: InvoiceInput["items"]) {
  return items.map((i, position) => ({ invoiceId, position, ...i }));
}

export async function listInvoices({ tab = "all", q = "" }: { tab?: StatusTab; q?: string } = {}) {
  const statuses = tabStatuses(tab);
  const match = (col: typeof invoices.number | typeof clients.name | typeof businesses.name) =>
    sql`${col} LIKE ${likePattern(q)} ESCAPE '\\'`;
  const filters = [
    statuses ? inArray(invoices.status, [...statuses]) : undefined,
    q.trim() ? or(match(invoices.number), match(clients.name), match(businesses.name)) : undefined,
  ];
  return getDb()
    .select({
      id: invoices.id,
      number: invoices.number,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      currency: invoices.currency,
      totalCents: invoices.totalCents,
      paidCents: invoices.paidCents,
      clientName: clients.name,
      businessName: businesses.name,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .innerJoin(businesses, eq(businesses.id, invoices.businessId))
    .where(and(...filters))
    .orderBy(desc(invoices.issueDate), desc(invoices.id));
}

/** Invoice counts per status, for the tab badges. */
export async function countInvoicesByStatus() {
  const rows = await getDb()
    .select({ status: invoices.status, n: sql<number>`count(*)` })
    .from(invoices)
    .groupBy(invoices.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<(typeof invoices.$inferSelect)["status"], number>>;
}

/** Marks a draft as sent. The guard in the WHERE keeps a double click from re-sending. */
export async function sendInvoice(id: number): Promise<boolean> {
  const found = await getInvoice(id);
  if (!found || !canSend(found.invoice.status)) return false;
  const d1 = getD1();
  await d1.batch([
    d1
      .prepare(`INSERT INTO events (invoice_id, type) SELECT id, 'sent' FROM invoices WHERE id = ?1 AND status = 'draft'`)
      .bind(id),
    d1
      .prepare(`UPDATE invoices SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?1 AND status = 'draft'`)
      .bind(id),
  ]);
  return true;
}

/** Voids an invoice but keeps the row, so its number stays used and it still lists as void. */
export async function voidInvoice(id: number): Promise<boolean> {
  const found = await getInvoice(id);
  if (!found || !canVoid(found.invoice.status, found.invoice.paidCents)) return false;
  const d1 = getD1();
  const guard = `FROM invoices WHERE id = ?1 AND paid_cents = 0 AND status NOT IN ('void', 'paid')`;
  await d1.batch([
    d1.prepare(`INSERT INTO events (invoice_id, type) SELECT id, 'voided' ${guard}`).bind(id),
    d1
      .prepare(`UPDATE invoices SET status = 'void', voided_at = datetime('now'), updated_at = datetime('now') WHERE id = ?1 AND paid_cents = 0 AND status NOT IN ('void', 'paid')`)
      .bind(id),
  ]);
  return true;
}

/** Copies an invoice into a new draft with the next number, dated today. */
export async function duplicateInvoice(id: number): Promise<number | null> {
  const found = await getInvoice(id);
  if (!found) return null;
  const business = await getBusiness(found.invoice.businessId);
  if (!business) return null;
  const today = todayChicago();
  return createInvoice({
    businessId: business.id,
    clientId: found.invoice.clientId,
    issueDate: today,
    dueDate: addDays(today, business.termsDays),
    notesMd: found.invoice.notesMd,
    items: found.items.map((i) => ({
      description: i.description,
      qtyMilli: i.qtyMilli,
      unitPriceCents: i.unitPriceCents,
      taxRateBp: i.taxRateBp,
    })),
  });
}

export async function getInvoice(id: number) {
  const db = getDb();
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) return null;
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.position));
  return { invoice, items };
}

/** Creates a draft with the business's next number; the number is claimed atomically first. */
export async function createInvoice(input: InvoiceInput): Promise<number | null> {
  const db = getDb();
  const business = await getBusiness(input.businessId);
  if (!business || !(await getClient(input.clientId))) return null;
  const [claimed] = await db
    .update(businesses)
    .set({ nextNumber: sql`${businesses.nextNumber} + 1` })
    .where(eq(businesses.id, business.id))
    .returning({ next: businesses.nextNumber });
  const number = `${business.numberPrefix}-${String(claimed.next - 1).padStart(4, "0")}`;
  const totals = computeTotals(input.items);
  const [row] = await db
    .insert(invoices)
    .values({
      businessId: business.id,
      clientId: input.clientId,
      number,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: business.currency,
      ...totals,
      shareToken: newShareToken(),
      notesMd: input.notesMd,
    })
    .returning({ id: invoices.id });
  await db.batch([
    db.insert(invoiceItems).values(itemRows(row.id, input.items)),
    db.insert(events).values({ invoiceId: row.id, type: "created" }),
  ]);
  return row.id;
}

/** Rewrites a draft's fields and lines in one batch. Other statuses are not editable. */
export async function updateDraftInvoice(id: number, input: InvoiceInput): Promise<boolean> {
  const db = getDb();
  const existing = await getInvoice(id);
  if (!existing || existing.invoice.status !== "draft") return false;
  const business = await getBusiness(input.businessId);
  if (!business || !(await getClient(input.clientId))) return false;
  // A different business means a different number series and currency, so only the original is allowed.
  if (business.id !== existing.invoice.businessId) return false;
  await db.batch([
    db
      .update(invoices)
      .set({
        clientId: input.clientId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        notesMd: input.notesMd,
        ...computeTotals(input.items),
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(invoices.id, id)),
    db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id)),
    db.insert(invoiceItems).values(itemRows(id, input.items)),
  ]);
  return true;
}

export async function listPayments(invoiceId: number) {
  return getDb().select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(asc(payments.paidOn), asc(payments.id));
}

/**
 * Records a payment and moves the invoice's paid amount and status in one batch.
 * Both statements carry the same guard (issued, unsettled, and not overpaid), so a stale
 * form or a double click records nothing instead of overpaying. Returns whether it applied.
 */
export async function recordPayment(invoiceId: number, input: PaymentInput): Promise<boolean> {
  const d1 = getD1();
  const guard = `FROM invoices WHERE id = ?1 AND status IN ('sent','viewed','partially_paid','overdue') AND paid_cents + ?2 <= total_cents`;
  const [inserted] = await d1.batch([
    d1
      .prepare(`INSERT INTO events (invoice_id, type, meta_json) SELECT id, 'payment', json_object('amountCents', ?2) ${guard}`)
      .bind(invoiceId, input.amountCents),
    d1
      .prepare(`INSERT INTO payments (invoice_id, amount_cents, paid_on, method, reference) SELECT id, ?2, ?3, ?4, ?5 ${guard}`)
      .bind(invoiceId, input.amountCents, input.paidOn, input.method, input.reference),
    d1
      .prepare(
        `UPDATE invoices SET paid_cents = paid_cents + ?2,
           status = CASE WHEN paid_cents + ?2 >= total_cents THEN 'paid' ELSE 'partially_paid' END,
           updated_at = datetime('now')
         WHERE id = ?1 AND status IN ('sent','viewed','partially_paid','overdue') AND paid_cents + ?2 <= total_cents`,
      )
      .bind(invoiceId, input.amountCents),
  ]);
  return (inserted.meta.changes ?? 0) > 0;
}

/** Everything the public invoice page may show, looked up by share token. Drafts are never public. */
export async function getInvoiceByToken(token: string) {
  const db = getDb();
  const [invoice] = await db.select().from(invoices).where(eq(invoices.shareToken, token)).limit(1);
  if (!invoice || invoice.status === "draft") return null;
  const [items, [business], [client], paymentList] = await Promise.all([
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id)).orderBy(asc(invoiceItems.position)),
    db.select().from(businesses).where(eq(businesses.id, invoice.businessId)).limit(1),
    db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1),
    db.select().from(payments).where(eq(payments.invoiceId, invoice.id)).orderBy(asc(payments.paidOn), asc(payments.id)),
  ]);
  if (!business) return null;
  return { invoice, items, business, client: client ?? null, payments: paymentList };
}

/**
 * Records the client's first view: stamps `viewed_at`, moves a sent invoice to viewed, and adds
 * the timeline event. The guard on `viewed_at IS NULL` makes concurrent opens record it once.
 */
export async function recordFirstView(invoiceId: number): Promise<void> {
  const d1 = getD1();
  const guard = `FROM invoices WHERE id = ?1 AND viewed_at IS NULL AND status <> 'draft'`;
  await d1.batch([
    d1.prepare(`INSERT INTO events (invoice_id, type) SELECT id, 'viewed' ${guard}`).bind(invoiceId),
    d1
      .prepare(
        `UPDATE invoices SET viewed_at = datetime('now'),
           status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END,
           updated_at = datetime('now')
         WHERE id = ?1 AND viewed_at IS NULL AND status <> 'draft'`,
      )
      .bind(invoiceId),
  ]);
}

export async function listEvents(invoiceId: number) {
  return getDb().select().from(events).where(eq(events.invoiceId, invoiceId)).orderBy(desc(events.at), desc(events.id));
}

export async function listRetainers() {
  return getDb()
    .select({
      id: retainers.id,
      title: retainers.title,
      cadence: retainers.cadence,
      active: retainers.active,
      nextRunOn: retainers.nextRunOn,
      itemsJson: retainers.itemsJson,
      clientName: clients.name,
      businessName: businesses.name,
      currency: businesses.currency,
    })
    .from(retainers)
    .innerJoin(clients, eq(clients.id, retainers.clientId))
    .innerJoin(businesses, eq(businesses.id, retainers.businessId))
    .orderBy(desc(retainers.active), asc(retainers.nextRunOn), asc(retainers.title));
}

export async function getRetainer(id: number) {
  const [row] = await getDb().select().from(retainers).where(eq(retainers.id, id)).limit(1);
  return row ?? null;
}

function retainerValues(input: RetainerInput) {
  const { items, ...rest } = input;
  const nextRunOn = rest.active
    ? (runDates(rest, 1, todayChicago())[0] ?? null)
    : null;
  return { ...rest, nextRunOn, itemsJson: JSON.stringify(items) };
}

export async function createRetainer(input: RetainerInput) {
  const [row] = await getDb().insert(retainers).values(retainerValues(input)).returning({ id: retainers.id });
  return row.id;
}

export async function updateRetainer(id: number, input: RetainerInput) {
  await getDb()
    .update(retainers)
    .set({ ...retainerValues(input), updatedAt: sql`(datetime('now'))` })
    .where(eq(retainers.id, id));
}
