import { env } from "cloudflare:workers";
import { headers } from "next/headers";

export type CurrentUser = { email: string };

/**
 * The signed-in user. Cloudflare Access puts the email in a header; locally
 * it comes from DEV_USER_EMAIL (in .dev.vars) and defaults to dev@localhost.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const h = await headers();
  const email = h.get("Cf-Access-Authenticated-User-Email") ?? env.DEV_USER_EMAIL ?? "dev@localhost";
  return { email: email.toLowerCase() };
}
