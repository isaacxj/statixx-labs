import { asc, eq, or, sql } from "drizzle-orm";
import { likePattern } from "@/lib/client-form";
import { getDb } from "./index";
import { businesses, clients } from "./schema";

export async function listBusinesses() {
  return getDb().select().from(businesses).orderBy(asc(businesses.name));
}

export async function listClients(query?: string) {
  const q = query?.trim();
  const match = q
    ? (() => {
        const p = likePattern(q);
        return or(
          sql`${clients.name} LIKE ${p} ESCAPE '\\'`,
          sql`${clients.company} LIKE ${p} ESCAPE '\\'`,
          sql`${clients.email} LIKE ${p} ESCAPE '\\'`,
        );
      })()
    : undefined;
  return getDb().select().from(clients).where(match).orderBy(asc(clients.name));
}

export async function getClient(id: number) {
  const [row] = await getDb().select().from(clients).where(eq(clients.id, id)).limit(1);
  return row ?? null;
}

export async function createClient(input: Omit<typeof clients.$inferInsert, "id">) {
  const [row] = await getDb().insert(clients).values(input).returning({ id: clients.id });
  return row.id;
}

export async function updateClient(id: number, input: Partial<typeof clients.$inferInsert>) {
  await getDb().update(clients).set(input).where(eq(clients.id, id));
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
