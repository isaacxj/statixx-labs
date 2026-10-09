import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { likePattern } from "@/lib/client-form";
import { formatProposalNumber } from "@/lib/proposal-form";
import { getDb } from "./index";
import { newShareToken } from "@/lib/share";
import { cleanSection, moveId } from "@/lib/section-form";
import { cleanLibraryEntry } from "@/lib/library-form";
import { buildSnapshot, cleanTemplateName, copyTitle, parseSnapshot, type Snapshot } from "@/lib/template";
import { statusAfterView } from "@/lib/activity";
import { businesses, clients, events, librarySections, lineItems, proposals, sections, templates, type ProposalStatus } from "./schema";

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
  return (await createDraft(input)).number;
}

async function createDraft(input: { title: string; businessId: number; clientId: number }, terms?: { discountBp: number; taxRateBp: number }) {
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
      taxRateBp: terms?.taxRateBp ?? business.taxRateBp,
      discountBp: terms?.discountBp ?? 0,
    }),
  ]);
  const [row] = await db.select({ id: proposals.id }).from(proposals).where(eq(proposals.number, number)).limit(1);
  await db.insert(events).values({ proposalId: row.id, type: "created" });
  return { id: row.id, number };
}

/** Writes snapshot sections and line items into a proposal. Each section is its own insert because line items need its id. */
async function applySnapshot(proposalId: number, snap: Snapshot) {
  const db = getDb();
  let position = 0;
  for (const s of snap.sections) {
    const [row] = await db
      .insert(sections)
      .values({ proposalId, position: ++position, kind: s.kind, ...cleanSection({ title: s.title, bodyMd: s.bodyMd }) })
      .returning({ id: sections.id });
    if (s.items.length > 0) {
      const [first, ...rest] = s.items.map((i, n) => db.insert(lineItems).values({ sectionId: row.id, position: n + 1, ...i }));
      await db.batch([first, ...rest]);
    }
  }
}

async function snapshotOf(proposalId: number): Promise<Snapshot | null> {
  const proposal = await getProposal(proposalId);
  if (!proposal) return null;
  const [secs, items] = await Promise.all([listSections(proposalId), listLineItems(proposalId)]);
  return buildSnapshot(proposal, secs, items);
}

/** A new draft with the same client, business, terms, sections and line items. Optional items start unticked. */
export async function duplicateProposal(proposalId: number) {
  const [source] = await getDb().select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  const snap = source ? await snapshotOf(proposalId) : null;
  if (!source || !snap) return null;
  const draft = await createDraft({ title: copyTitle(source.title), businessId: source.businessId, clientId: source.clientId }, snap);
  await applySnapshot(draft.id, snap);
  return draft;
}

export async function listTemplates() {
  const rows = await getDb()
    .select({ id: templates.id, name: templates.name, businessId: templates.businessId, businessName: businesses.name, snapshotJson: templates.snapshotJson })
    .from(templates)
    .innerJoin(businesses, eq(templates.businessId, businesses.id))
    .orderBy(asc(templates.name), asc(templates.id));
  return rows.map(({ snapshotJson, ...t }) => ({ ...t, sectionCount: parseSnapshot(snapshotJson).sections.length }));
}

export async function saveProposalAsTemplate(proposalId: number, name: string) {
  const [source] = await getDb().select({ businessId: proposals.businessId, title: proposals.title }).from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  const snap = source ? await snapshotOf(proposalId) : null;
  if (!source || !snap) return null;
  const clean = cleanTemplateName(name || source.title);
  await getDb().insert(templates).values({ name: clean, businessId: source.businessId, snapshotJson: JSON.stringify(snap) });
  return clean;
}

export async function deleteTemplate(id: number) {
  await getDb().delete(templates).where(eq(templates.id, id));
}

/** A ready draft for the chosen client from a template, using the template's business. */
export async function createProposalFromTemplate(templateId: number, clientId: number, title?: string) {
  const [t] = await getDb().select().from(templates).where(eq(templates.id, templateId)).limit(1);
  if (!t) return null;
  const snap = parseSnapshot(t.snapshotJson);
  const draft = await createDraft({ title: title?.trim() || t.name, businessId: t.businessId, clientId }, snap);
  await applySnapshot(draft.id, snap);
  return draft;
}

export async function getProposal(id: number) {
  const [row] = await getDb()
    .select({
      id: proposals.id,
      number: proposals.number,
      title: proposals.title,
      status: proposals.status,
      currency: proposals.currency,
      discountBp: proposals.discountBp,
      taxRateBp: proposals.taxRateBp,
      shareToken: proposals.shareToken,
      sentAt: proposals.sentAt,
      firstViewedAt: proposals.firstViewedAt,
      viewCount: proposals.viewCount,
      clientName: clients.name,
      clientCompany: clients.company,
      businessName: businesses.name,
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .innerJoin(businesses, eq(proposals.businessId, businesses.id))
    .where(eq(proposals.id, id))
    .limit(1);
  return row ?? null;
}

export async function listSections(proposalId: number) {
  return getDb().select().from(sections).where(eq(sections.proposalId, proposalId)).orderBy(asc(sections.position), asc(sections.id));
}

export async function addSection(
  proposalId: number,
  input: { title: string; bodyMd: string } = { title: "Untitled section", bodyMd: "" },
  kind: "text" | "pricing" = "text",
) {
  const db = getDb();
  const [last] = await db
    .select({ n: sql<number>`coalesce(max(${sections.position}), 0)` })
    .from(sections)
    .where(eq(sections.proposalId, proposalId));
  const [row] = await db
    .insert(sections)
    .values({ proposalId, position: last.n + 1, kind, ...cleanSection(input) })
    .returning({ id: sections.id });
  return row.id;
}

export async function updateSection(id: number, proposalId: number, input: { title: string; bodyMd: string }) {
  await getDb()
    .update(sections)
    .set(cleanSection(input))
    .where(and(eq(sections.id, id), eq(sections.proposalId, proposalId)));
}

/** Deletes a section and closes the gap in positions in one batch. */
export async function deleteSection(id: number, proposalId: number) {
  const db = getDb();
  const rest = (await listSections(proposalId)).filter((s) => s.id !== id);
  await db.batch([
    db.delete(sections).where(and(eq(sections.id, id), eq(sections.proposalId, proposalId))),
    ...rest.map((s, i) => db.update(sections).set({ position: i + 1 }).where(eq(sections.id, s.id))),
  ]);
}

export async function moveSection(id: number, proposalId: number, dir: -1 | 1) {
  const db = getDb();
  const current = await listSections(proposalId);
  const next = moveId(current.map((s) => s.id), id, dir);
  if (!next) return;
  const [first, ...rest] = next.map((sid, i) => db.update(sections).set({ position: i + 1 }).where(eq(sections.id, sid)));
  await db.batch([first, ...rest]);
}

/** Every line item of a proposal, in section then row order. */
export async function listLineItems(proposalId: number) {
  return getDb()
    .select({ item: lineItems })
    .from(lineItems)
    .innerJoin(sections, eq(lineItems.sectionId, sections.id))
    .where(eq(sections.proposalId, proposalId))
    .orderBy(asc(sections.position), asc(lineItems.position), asc(lineItems.id))
    .then((rows) => rows.map((r) => r.item));
}

const ownedItem = (id: number, proposalId: number) =>
  and(eq(lineItems.id, id), sql`${lineItems.sectionId} IN (SELECT id FROM sections WHERE proposal_id = ${proposalId})`);

export async function addLineItem(sectionId: number, proposalId: number) {
  const db = getDb();
  const [section] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.proposalId, proposalId), eq(sections.kind, "pricing")));
  if (!section) return;
  const [last] = await db
    .select({ n: sql<number>`coalesce(max(${lineItems.position}), 0)` })
    .from(lineItems)
    .where(eq(lineItems.sectionId, sectionId));
  await db.insert(lineItems).values({ sectionId, position: last.n + 1 });
}

export type LineItemPatch = {
  description?: string;
  qtyMilli?: number;
  unitPriceCents?: number;
  recurring?: "none" | "monthly";
  optional?: boolean;
  selected?: boolean;
};

export async function updateLineItem(id: number, proposalId: number, patch: LineItemPatch) {
  if (Object.keys(patch).length === 0) return;
  await getDb().update(lineItems).set(patch).where(ownedItem(id, proposalId));
}

export async function deleteLineItem(id: number, proposalId: number) {
  await getDb().delete(lineItems).where(ownedItem(id, proposalId));
}

export async function updateProposalPricing(proposalId: number, input: { discountBp: number; taxRateBp: number }) {
  await getDb().update(proposals).set(input).where(eq(proposals.id, proposalId));
}

export async function listLibrary(query?: string) {
  const q = query?.trim();
  const p = q ? likePattern(q) : null;
  const match = p
    ? or(
        sql`${librarySections.title} LIKE ${p} ESCAPE '\\'`,
        sql`${librarySections.category} LIKE ${p} ESCAPE '\\'`,
        sql`${librarySections.bodyMd} LIKE ${p} ESCAPE '\\'`,
      )
    : undefined;
  return getDb().select().from(librarySections).where(match).orderBy(asc(librarySections.category), asc(librarySections.title), asc(librarySections.id));
}

export async function createLibrarySection(input: { category: string; title: string; bodyMd: string }) {
  const [row] = await getDb().insert(librarySections).values(cleanLibraryEntry(input)).returning({ id: librarySections.id });
  return row.id;
}

export async function deleteLibrarySection(id: number) {
  await getDb().delete(librarySections).where(eq(librarySections.id, id));
}

/** Copies a library entry into the proposal as a new text section; the library row is never linked or changed. */
export async function insertLibrarySection(proposalId: number, libraryId: number) {
  const [entry] = await getDb().select().from(librarySections).where(eq(librarySections.id, libraryId)).limit(1);
  if (!entry) return null;
  return addSection(proposalId, { title: entry.title, bodyMd: entry.bodyMd });
}

/** The proposal's private link token, created on first use and stable afterwards. */
export async function ensureShareToken(proposalId: number) {
  const db = getDb();
  const [row] = await db.select({ token: proposals.shareToken }).from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!row) return null;
  if (row.token) return row.token;
  const token = newShareToken();
  await db.update(proposals).set({ shareToken: token }).where(and(eq(proposals.id, proposalId), sql`${proposals.shareToken} IS NULL`));
  const [after] = await db.select({ token: proposals.shareToken }).from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  return after?.token ?? null;
}

/** Marks a draft as sent (and makes sure it has a link). Later statuses are left alone. */
export async function markProposalSent(proposalId: number) {
  const token = await ensureShareToken(proposalId);
  if (!token) return null;
  const db = getDb();
  const [changed] = await db
    .update(proposals)
    .set({ status: "sent", sentAt: sql`(CURRENT_TIMESTAMP)` })
    .where(and(eq(proposals.id, proposalId), eq(proposals.status, "draft")))
    .returning({ id: proposals.id });
  if (changed) await db.insert(events).values({ proposalId, type: "sent" });
  return token;
}

/** Everything the public page shows for one token, and nothing else: no ids of other records, no internal fields. */
export async function getPublicProposal(token: string) {
  const db = getDb();
  const [p] = await db
    .select({
      id: proposals.id,
      number: proposals.number,
      title: proposals.title,
      status: proposals.status,
      currency: proposals.currency,
      discountBp: proposals.discountBp,
      taxRateBp: proposals.taxRateBp,
      validUntil: proposals.validUntil,
      sentAt: proposals.sentAt,
      clientName: clients.name,
      clientCompany: clients.company,
      businessName: businesses.name,
      businessLegalName: businesses.legalName,
      businessAddress: businesses.address,
      businessAccent: businesses.accent,
      hasLogo: sql<number>`${businesses.logoKey} IS NOT NULL`,
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .innerJoin(businesses, eq(proposals.businessId, businesses.id))
    .where(eq(proposals.shareToken, token))
    .limit(1);
  if (!p) return null;
  const [secs, lines] = await Promise.all([listSections(p.id), listLineItems(p.id)]);
  return { proposal: p, sections: secs, lines };
}

export async function getLogoKeyByToken(token: string) {
  const [row] = await getDb()
    .select({ key: businesses.logoKey })
    .from(proposals)
    .innerJoin(businesses, eq(proposals.businessId, businesses.id))
    .where(eq(proposals.shareToken, token))
    .limit(1);
  return row?.key ?? null;
}

/** Counts one client view: first view time, view count, sent becomes viewed, and a timeline entry. */
export async function recordProposalView(proposalId: number) {
  const db = getDb();
  const [row] = await db
    .update(proposals)
    .set({
      viewCount: sql`${proposals.viewCount} + 1`,
      firstViewedAt: sql`COALESCE(${proposals.firstViewedAt}, CURRENT_TIMESTAMP)`,
    })
    .where(eq(proposals.id, proposalId))
    .returning({ viewCount: proposals.viewCount, status: proposals.status });
  if (!row) return;
  const next = statusAfterView(row.status);
  if (next !== row.status) await db.update(proposals).set({ status: next }).where(and(eq(proposals.id, proposalId), eq(proposals.status, row.status)));
  await db.insert(events).values({ proposalId, type: "viewed", metaJson: JSON.stringify({ n: row.viewCount }) });
}

export async function listEvents(proposalId: number) {
  return getDb().select().from(events).where(eq(events.proposalId, proposalId)).orderBy(desc(events.at), desc(events.id));
}
