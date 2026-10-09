export const MAX_TITLE = 120;
export const MAX_BODY = 20000;

/** Clamp user text to the stored limits; titles are single-line. */
export function cleanSection(input: { title: string; bodyMd: string }) {
  return {
    title: input.title.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE),
    bodyMd: input.bodyMd.replace(/\r\n/g, "\n").slice(0, MAX_BODY),
  };
}

/** Returns the ids in their new order after moving `id` one step, or null if it can't move. */
export function moveId(ids: number[], id: number, dir: -1 | 1): number[] | null {
  const from = ids.indexOf(id);
  const to = from + dir;
  if (from < 0 || to < 0 || to >= ids.length) return null;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
