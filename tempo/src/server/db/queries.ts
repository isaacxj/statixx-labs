import { asc, eq, sql } from "drizzle-orm";
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

export async function getProject(id: number) {
  const rows = await getDb()
    .select({
      id: projects.id,
      clientId: projects.clientId,
      name: projects.name,
      billing: projects.billing,
      rateCents: projects.rateCents,
      budgetMinutes: projects.budgetMinutes,
      fixedFeeCents: projects.fixedFeeCents,
      color: projects.color,
      status: projects.status,
    })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listClientsWithCounts() {
  const rows = await listClients();
  const ps = await listProjects();
  return rows.map((c) => ({ ...c, projectCount: ps.filter((p) => p.clientName === c.name && p.status === "active").length }));
}

export async function createClient(businessId: number, name: string) {
  await getDb().insert(clients).values({ businessId, name });
}

export async function renameClient(id: number, name: string) {
  await getDb().update(clients).set({ name, updatedAt: sql`(datetime('now'))` }).where(eq(clients.id, id));
}

type ProjectValues = Omit<typeof projects.$inferInsert, "id" | "status" | "createdAt" | "updatedAt">;

export async function createProject(values: ProjectValues) {
  await getDb().insert(projects).values(values);
}

export async function updateProject(id: number, values: ProjectValues) {
  await getDb().update(projects).set({ ...values, updatedAt: sql`(datetime('now'))` }).where(eq(projects.id, id));
}

export async function setProjectStatus(id: number, status: "active" | "archived") {
  await getDb().update(projects).set({ status, updatedAt: sql`(datetime('now'))` }).where(eq(projects.id, id));
}
