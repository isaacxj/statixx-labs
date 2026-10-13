import { headers } from "next/headers";
import { env } from "cloudflare:workers";

import { initialsFromEmail } from "@/lib/user";

export type CurrentUser = { email: string; initials: string };

export async function getCurrentUser(): Promise<CurrentUser> {
  const h = await headers();
  const email = h.get("Cf-Access-Authenticated-User-Email") ?? env.DEV_USER_EMAIL ?? "unknown@localhost";
  return { email, initials: initialsFromEmail(email) };
}
