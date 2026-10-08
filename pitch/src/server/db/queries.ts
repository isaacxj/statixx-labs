import { asc, eq } from "drizzle-orm";
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

export async function createBusiness(input: Omit<typeof businesses.$inferInsert, "id">) {
  const [row] = await getDb().insert(businesses).values(input).returning({ id: businesses.id });
  return row.id;
}

export async function updateBusiness(id: number, input: Partial<typeof businesses.$inferInsert>) {
  await getDb().update(businesses).set(input).where(eq(businesses.id, id));
}
