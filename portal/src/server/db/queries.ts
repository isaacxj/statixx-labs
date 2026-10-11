import { asc, eq } from "drizzle-orm";
import { getDb } from "./index";
import { clientUsers, clients, projects } from "./schema";

export async function listClientsWithUsers() {
  const db = getDb();
  const [clientRows, userRows] = await Promise.all([
    db.select().from(clients).orderBy(asc(clients.name)),
    db.select().from(clientUsers).orderBy(asc(clientUsers.email)),
  ]);
  return clientRows.map((c) => ({ ...c, users: userRows.filter((u) => u.clientId === c.id) }));
}

export async function listProjectsWithClient() {
  return getDb()
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      summary: projects.summary,
      dueOn: projects.dueOn,
      clientName: clients.name,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(asc(clients.name), asc(projects.name));
}
