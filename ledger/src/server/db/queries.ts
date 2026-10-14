import { asc } from "drizzle-orm";
import { getDb } from "./index";
import { businesses, clients } from "./schema";

export async function listBusinesses() {
  return getDb().select().from(businesses).orderBy(asc(businesses.name));
}

export async function listClients() {
  return getDb().select().from(clients).orderBy(asc(clients.name));
}
