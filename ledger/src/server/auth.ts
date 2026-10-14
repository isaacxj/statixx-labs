import { headers } from "next/headers";
import { env } from "cloudflare:workers";
import { initialsFromEmail } from "@/lib/initials";

export type CurrentUser = { email: string; initials: string };

/** Cloudflare Access sets the header; DEV_USER_EMAIL stands in locally. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const h = await headers();
  const email = h.get("cf-access-authenticated-user-email") ?? env.DEV_USER_EMAIL ?? null;
  if (!email) return null;
  return { email, initials: initialsFromEmail(email) };
}
