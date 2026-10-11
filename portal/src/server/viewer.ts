import { headers } from "next/headers";
import { env } from "cloudflare:workers";
import { resolveViewer, type Viewer } from "@/lib/viewer";
import type { CurrentUser } from "@/lib/access";
import { getActiveClientUser } from "@/server/db/queries";

/** The signed-in user: the Access header in production, DEV_USER_EMAIL locally. */
export async function getViewer(): Promise<Viewer> {
  const h = await headers();
  const email = h.get("cf-access-authenticated-user-email") ?? env.DEV_USER_EMAIL ?? "unknown@localhost";
  return resolveViewer(email, env.TEAM_EMAILS);
}

/** Who is signed in and what they are: team, an active client user, or an unknown email with no access. */
export async function getCurrentUser(): Promise<CurrentUser> {
  const viewer = await getViewer();
  const { email, initials } = viewer;
  if (viewer.variant === "team") return { kind: "team", email, initials };
  const clientUser = await getActiveClientUser(email);
  if (!clientUser) return { kind: "none", email, initials };
  return { kind: "client", email, initials, ...clientUser };
}
