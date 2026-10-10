import { asc, eq } from "drizzle-orm";
import { getDb } from "./index";
import { businesses, clients, projects } from "./schema";

export async function listBusinesses() {
  return getDb().select().from(businesses).orderBy(asc(businesses.name));
}

export async function listClients() {
  return getDb()
    .select({ id: clients.id, name: clients.name, businessName: businesses.name })
    .from(clients)
    .innerJoin(businesses, eq(clients.businessId, businesses.id))
    .orderBy(asc(clients.name));
}

export async function listProjects() {
  return getDb()
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.name,
      billing: projects.billing,
      rateCents: projects.rateCents,
      budgetMinutes: projects.budgetMinutes,
      fixedFeeCents: projects.fixedFeeCents,
      color: projects.color,
      status: projects.status,
      currency: businesses.currency,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .innerJoin(businesses, eq(clients.businessId, businesses.id))
    .orderBy(asc(clients.name), asc(projects.name));
}
