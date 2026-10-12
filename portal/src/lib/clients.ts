import { CLIENT_USER_ROLES, type ClientUserRole } from "@/server/db/schema";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX = /^#[0-9a-fA-F]{6}$/;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseClientInput(form: FormData): Result<{ name: string; slug: string; accent: string }> {
  const name = String(form.get("name") ?? "").trim();
  const accent = String(form.get("accent") ?? "#0EA5E9").trim();
  if (!name) return { ok: false, error: "Enter a client name." };
  const slug = slugify(name);
  if (!slug) return { ok: false, error: "The name needs letters or numbers." };
  if (!HEX.test(accent)) return { ok: false, error: "Accent must be a hex color like #0EA5E9." };
  return { ok: true, value: { name, slug, accent: accent.toUpperCase() } };
}

export function parseClientUserInput(form: FormData): Result<{ email: string; name: string; role: ClientUserRole }> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const role = String(form.get("role") ?? "viewer");
  if (!EMAIL.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (!(CLIENT_USER_ROLES as readonly string[]).includes(role)) return { ok: false, error: "Pick viewer or approver." };
  return { ok: true, value: { email, name, role: role as ClientUserRole } };
}
