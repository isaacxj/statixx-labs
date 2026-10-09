import { MAX_BODY, MAX_TITLE } from "@/lib/section-form";

export const MAX_CATEGORY = 40;
export const DEFAULT_CATEGORY = "General";

/** Clamp library input to the stored limits; an empty category falls back to General. */
export function cleanLibraryEntry(input: { category: string; title: string; bodyMd: string }) {
  return {
    category: input.category.replace(/\s+/g, " ").trim().slice(0, MAX_CATEGORY) || DEFAULT_CATEGORY,
    title: input.title.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE) || "Untitled section",
    bodyMd: input.bodyMd.replace(/\r\n/g, "\n").slice(0, MAX_BODY),
  };
}

/** Groups entries by category, categories A–Z, keeping each group's incoming order. */
export function groupByCategory<T extends { category: string }>(entries: T[]): { category: string; entries: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const e of entries) groups.set(e.category, [...(groups.get(e.category) ?? []), e]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, list]) => ({ category, entries: list }));
}
