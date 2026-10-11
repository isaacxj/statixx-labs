import { and, asc, eq, sql } from "drizzle-orm";
import { canSeeClient, type CurrentUser } from "@/lib/access";
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

/** Projects the given client user may see: only their own client's, and only while their access is active. */
export async function listProjectsForClientEmail(email: string) {
  return getDb()
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      summary: projects.summary,
      dueOn: projects.dueOn,
      clientName: clients.name,
    })
    .from(clientUsers)
    .innerJoin(clients, eq(clientUsers.clientId, clients.id))
    .innerJoin(projects, eq(projects.clientId, clients.id))
    .where(and(sql`lower(${clientUsers.email}) = ${email.trim().toLowerCase()}`, eq(clientUsers.active, true)))
    .orderBy(asc(projects.name));
}

export async function hasActiveClientUser(email: string) {
  const rows = await getDb()
    .select({ id: clientUsers.id })
    .from(clientUsers)
    .where(and(sql`lower(${clientUsers.email}) = ${email.trim().toLowerCase()}`, eq(clientUsers.active, true)))
    .limit(1);
  return rows.length > 0;
}

/** The active client user behind an email, with their client, or null. */
export async function getActiveClientUser(email: string) {
  const rows = await getDb()
    .select({ clientId: clientUsers.clientId, clientName: clients.name, role: clientUsers.role })
    .from(clientUsers)
    .innerJoin(clients, eq(clientUsers.clientId, clients.id))
    .where(and(sql`lower(${clientUsers.email}) = ${email.trim().toLowerCase()}`, eq(clientUsers.active, true)))
    .limit(1);
  return rows[0] ?? null;
}

/** One project, only if the user may see its client; null otherwise so callers answer 404. */
export async function getProjectForUser(user: CurrentUser, projectId: number) {
  if (user.kind === "none") return null;
  const rows = await getDb()
    .select({
      id: projects.id,
      clientId: projects.clientId,
      name: projects.name,
      status: projects.status,
      summary: projects.summary,
      startsOn: projects.startsOn,
      dueOn: projects.dueOn,
      clientName: clients.name,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, projectId))
    .limit(1);
  const project = rows[0];
  return project && canSeeClient(user, project.clientId) ? project : null;
}
