import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { likePattern } from "@/lib/client-form";
import { formatProposalNumber } from "@/lib/proposal-form";
import { getDb } from "./index";
import { businesses, clients, proposals, type ProposalStatus } from "./schema";

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

export async function listProposals(opts: { status?: ProposalStatus | null; query?: string } = {}) {
  const q = opts.query?.trim();
  const p = q ? likePattern(q) : null;
  const match = and(
    opts.status ? eq(proposals.status, opts.status) : undefined,
    p
      ? or(
          sql`${proposals.number} LIKE ${p} ESCAPE '\\'`,
          sql`${proposals.title} LIKE ${p} ESCAPE '\\'`,
          sql`${clients.name} LIKE ${p} ESCAPE '\\'`,
          sql`${clients.company} LIKE ${p} ESCAPE '\\'`,
        )
      : undefined,
  );
  return getDb()
    .select({
      id: proposals.id,
      number: proposals.number,
      title: proposals.title,
      status: proposals.status,
      currency: proposals.currency,
      sentAt: proposals.sentAt,
      createdAt: proposals.createdAt,
      clientName: clients.name,
      clientCompany: clients.company,
      businessName: businesses.name,
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .innerJoin(businesses, eq(proposals.businessId, businesses.id))
    .where(match)
    .orderBy(desc(proposals.createdAt), desc(proposals.id));
}

export async function countProposalsByStatus() {
  const rows = await getDb()
    .select({ status: proposals.status, n: sql<number>`count(*)` })
    .from(proposals)
    .groupBy(proposals.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<ProposalStatus, number>>;
}

/** Creates a draft and takes the business's next number in one atomic batch. */
export async function createProposal(input: { title: string; businessId: number; clientId: number }) {
  const db = getDb();
  const business = await getBusiness(input.businessId);
  if (!business) throw new Error("Business not found");
  const number = formatProposalNumber(business.numberPrefix, business.nextNumber);
  await db.batch([
    db
      .update(businesses)
      .set({ nextNumber: business.nextNumber + 1 })
      .where(and(eq(businesses.id, business.id), eq(businesses.nextNumber, business.nextNumber))),
    db.insert(proposals).values({
      businessId: business.id,
      clientId: input.clientId,
      number,
      title: input.title,
      currency: business.currency,
      taxRateBp: business.taxRateBp,
    }),
  ]);
  return number;
}
