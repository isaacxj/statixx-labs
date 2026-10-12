"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { env } from "cloudflare:workers";
import { parseBrandingInput } from "@/lib/branding";
import { parseClientInput, parseClientUserInput } from "@/lib/clients";
import { getCurrentUser } from "@/server/viewer";
import { insertClient, insertClientUser, updateClientBranding, updateClientUser } from "@/server/db/queries";
import { CLIENT_USER_ROLES, type ClientUserRole } from "@/server/db/schema";

async function requireTeam() {
  const user = await getCurrentUser();
  if (user.kind !== "team") throw new Error("Team only");
}

const back = (path: string, key: "error" | "saved", message: string) => redirect(`${path}?${key}=${encodeURIComponent(message)}`);

export async function createClientAction(form: FormData) {
  await requireTeam();
  const parsed = parseClientInput(form);
  if (!parsed.ok) return back("/clients", "error", parsed.error);
  const id = await insertClient(parsed.value);
  if (id === null) return back("/clients", "error", "A client with that name already exists.");
  revalidatePath("/clients");
  return redirect(`/clients/${id}?saved=${encodeURIComponent("Client added")}`);
}

export async function addClientUserAction(clientId: number, form: FormData) {
  await requireTeam();
  const path = `/clients/${clientId}`;
  const parsed = parseClientUserInput(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  if (!(await insertClientUser(clientId, parsed.value))) return back(path, "error", "That email already has portal access.");
  revalidatePath(path);
  return back(path, "saved", `${parsed.value.email} added as ${parsed.value.role}`);
}

export async function updateClientUserAction(clientId: number, userId: number, form: FormData) {
  await requireTeam();
  const path = `/clients/${clientId}`;
  const role = String(form.get("role") ?? "");
  const patch: { role?: ClientUserRole; active?: boolean } = {};
  if ((CLIENT_USER_ROLES as readonly string[]).includes(role)) patch.role = role as ClientUserRole;
  if (form.has("active")) patch.active = form.get("active") === "1";
  await updateClientUser(clientId, userId, patch);
  revalidatePath(path);
  return back(path, "saved", "User updated");
}

export async function updateBrandingAction(clientId: number, form: FormData) {
  await requireTeam();
  const path = `/clients/${clientId}`;
  const parsed = parseBrandingInput(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  const { accent, logo, removeLogo } = parsed.value;
  const newKey = logo ? `logos/${clientId}/${crypto.randomUUID()}` : null;
  if (logo && newKey) await env.FILES.put(newKey, await logo.arrayBuffer(), { httpMetadata: { contentType: logo.type } });
  const replaced = await updateClientBranding(clientId, accent, newKey ?? (removeLogo ? null : undefined));
  if (replaced === undefined) return back("/clients", "error", "That client no longer exists.");
  if (replaced && (newKey || removeLogo)) await env.FILES.delete(replaced);
  revalidatePath("/", "layout");
  return back(path, "saved", "Branding updated");
}
