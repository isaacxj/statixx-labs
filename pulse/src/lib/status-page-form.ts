export const RESERVED_SLUGS = ["new", "admin", "api"];

export type StatusPageInput = { title: string; slug: string; accent: string; introMd: string };
export type StatusPageErrors = Partial<Record<keyof StatusPageInput, string>>;
export type StatusPageFormResult = { ok: true; value: StatusPageInput } | { ok: false; errors: StatusPageErrors };

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

export function parseStatusPageForm(form: FormData): StatusPageFormResult {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const errors: StatusPageErrors = {};

  const title = text("title");
  if (!title) errors.title = "Give the page a title.";

  const slug = slugify(text("slug") || title);
  if (!slug) errors.slug = "Use letters or numbers for the address.";
  else if (RESERVED_SLUGS.includes(slug)) errors.slug = `"${slug}" is reserved. Pick another address.`;

  const accent = text("accent").toLowerCase() || "#f43f5e";
  if (!/^#[0-9a-f]{6}$/.test(accent)) errors.accent = "Use a hex color like #f43f5e.";

  const introMd = String(form.get("introMd") ?? "").trim();
  if (introMd.length > 1000) errors.introMd = "Keep the intro under 1000 characters.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { title, slug, accent, introMd } };
}

export type PageMonitorInput = { monitorId: number; displayName: string };

/** Drops blanks and repeats, trims names; array order becomes display order. */
export function cleanPageMonitors(items: { monitorId: number; displayName: string }[], fallbackNames: Map<number, string>): PageMonitorInput[] {
  const seen = new Set<number>();
  const out: PageMonitorInput[] = [];
  for (const item of items) {
    if (!fallbackNames.has(item.monitorId) || seen.has(item.monitorId)) continue;
    seen.add(item.monitorId);
    out.push({ monitorId: item.monitorId, displayName: item.displayName.trim() || fallbackNames.get(item.monitorId)! });
  }
  return out;
}
