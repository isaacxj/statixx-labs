import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** The D1 binding is read per request; never cache it at module level. */
export const getDb = () => drizzle(env.DB, { schema });
