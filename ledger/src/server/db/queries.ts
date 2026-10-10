import { asc, desc, eq, or, sql } from "drizzle-orm";
import { computeTotals } from "@/lib/invoice-math";
import type { InvoiceInput } from "@/lib/invoice-form";
import { likePattern } from "@/lib/client-form";
import { getDb } from "./index";
import { businesses, clients, invoiceItems, invoices } from "./schema";

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

export async function listInvoices() {
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
    .orderBy(desc(invoices.issueDate), desc(invoices.id));
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
  await db.insert(invoiceItems).values(itemRows(row.id, input.items));
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
