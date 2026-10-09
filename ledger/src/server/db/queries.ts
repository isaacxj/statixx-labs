import { asc, eq, or, sql } from "drizzle-orm";
import { likePattern } from "@/lib/client-form";
import { getDb } from "./index";
import { businesses, clients } from "./schema";

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
