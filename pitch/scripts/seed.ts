import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import { businesses, clients, proposals, sections } from "../src/server/db/schema";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>();
const db = drizzle(env.DB);

await db.delete(sections);
await db.delete(proposals);
await db.delete(clients);
await db.delete(businesses);

await db.batch([
  db.insert(businesses).values([
    { name: "Statixx", legalName: "Statixx LLC", numberPrefix: "STX", currency: "USD", taxRateBp: 0 },
    { name: "Aptixx", legalName: "Aptixx Inc.", numberPrefix: "APT", currency: "CAD", taxRateBp: 500, accent: "#0EA5E9" },
    { name: "Trazo", legalName: "Trazo Studio", numberPrefix: "TRZ", currency: "USD", accent: "#10B981" },
  ]),
  db.insert(clients).values([
    { name: "Maria Alvarez", company: "Northwind Dental", email: "maria@northwind.example" },
    { name: "Devon Park", company: "Park & Sons Roofing", email: "devon@parkroofing.example", phone: "555-0142" },
    { name: "Priya Shah", company: "Lumen Cafe", email: "priya@lumen.example" },
  ]),
]);

const [stx, apt] = await db.select().from(businesses).orderBy(businesses.id);
const [maria, devon, priya] = await db.select().from(clients).orderBy(clients.id);
await db.batch([
  db.insert(proposals).values([
    { businessId: stx.id, clientId: maria.id, number: "STX-2026-001", title: "Website redesign", status: "sent", sentAt: "2026-10-01 15:00:00" },
    { businessId: stx.id, clientId: priya.id, number: "STX-2026-002", title: "Online ordering setup" },
    { businessId: apt.id, clientId: devon.id, number: "APT-2026-001", title: "Lead tracking app", currency: "CAD", taxRateBp: 500, status: "accepted", sentAt: "2026-09-20 14:00:00" },
  ]),
  db.update(businesses).set({ nextNumber: 3 }).where(eq(businesses.id, stx.id)),
  db.update(businesses).set({ nextNumber: 2 }).where(eq(businesses.id, apt.id)),
]);

const [first] = await db.select().from(proposals).orderBy(proposals.id);
await db.insert(sections).values([
  { proposalId: first.id, position: 1, title: "Overview", bodyMd: "We will redesign the Northwind Dental site so patients can **book online** in under a minute.\n\n- Faster, mobile-first pages\n- Online booking\n- Clear pricing for new patients" },
  { proposalId: first.id, position: 2, title: "Timeline", bodyMd: "1. Discovery, week 1\n2. Design, weeks 2-3\n3. Build and launch, weeks 4-6" },
  { proposalId: first.id, position: 3, title: "Terms", bodyMd: "50% due at kickoff, 50% on launch. Questions? Email [hello@statixx.example](mailto:hello@statixx.example)." },
]);

console.log("Seeded 3 businesses, 3 clients, 3 proposals and 3 sections");
await dispose();
