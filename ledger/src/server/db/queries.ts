import { asc, eq, sql } from "drizzle-orm";
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
