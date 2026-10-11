import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

/** The D1 database for the current request. Call per request; never cache the result at module level. */
export function getDb() {
  return drizzle(env.DB, { schema });
}
