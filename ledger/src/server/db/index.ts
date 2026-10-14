import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

/** The D1 binding is per request, so build the client on each call. */
export function getDb() {
  return drizzle(env.DB, { schema });
}

/** The raw binding, for statements that must run together in one atomic `batch`. */
export function getD1() {
  return env.DB;
}
