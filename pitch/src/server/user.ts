import { headers } from "next/headers";

export type CurrentUser = { email: string; initials: string };

export async function getCurrentUser(): Promise<CurrentUser> {
  const h = await headers();
  const email = h.get("Cf-Access-Authenticated-User-Email") ?? process.env.DEV_USER_EMAIL ?? "isaac@example.com";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2)).toUpperCase();
  return { email, initials };
}
