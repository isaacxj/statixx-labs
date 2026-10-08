import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import { businesses, clients } from "../src/server/db/schema";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>();
const db = drizzle(env.DB);

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

console.log("Seeded 3 businesses and 3 clients");
await dispose();
