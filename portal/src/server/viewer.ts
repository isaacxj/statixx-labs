import { headers } from "next/headers";
import { env } from "cloudflare:workers";
import { resolveViewer, type Viewer } from "@/lib/viewer";

/** The signed-in user: the Access header in production, DEV_USER_EMAIL locally. */
export async function getViewer(): Promise<Viewer> {
  const h = await headers();
  const email = h.get("cf-access-authenticated-user-email") ?? env.DEV_USER_EMAIL ?? "unknown@localhost";
  return resolveViewer(email, env.TEAM_EMAILS);
}
