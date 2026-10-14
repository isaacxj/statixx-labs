export type PaletteGroup = "Actions" | "Pages" | "Proposals" | "Clients";

export type PaletteItem = {
  key: string;
  group: PaletteGroup;
  label: string;
  /** Secondary text, also searched. */
  hint?: string;
  href?: string;
  /** Run in place instead of navigating. */
  action?: "mark-sent";
};

const ORDER: PaletteGroup[] = ["Actions", "Pages", "Proposals", "Clients"];
const IDLE_LIMIT: Partial<Record<PaletteGroup, number>> = { Proposals: 5, Clients: 0 };
const MAX_RESULTS = 24;

/** Items matching every word of the query, grouped in display order. An empty query shows a short default list. */
export function filterPalette(items: PaletteItem[], query: string): PaletteItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const out: PaletteItem[] = [];
  for (const group of ORDER) {
    let pool = items.filter((i) => i.group === group);
    if (words.length) {
      pool = pool.filter((i) => {
        const hay = `${i.label} ${i.hint ?? ""}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    } else {
      pool = pool.slice(0, IDLE_LIMIT[group] ?? pool.length);
    }
    out.push(...pool);
  }
  return out.slice(0, MAX_RESULTS);
}

/** The proposal id when the path is `/proposals/<id>`, else null (`/proposals/new` is not an id). */
export function proposalIdFromPath(pathname: string): number | null {
  const m = /^\/proposals\/(\d+)\/?$/.exec(pathname);
  return m ? Number(m[1]) : null;
}

/** True for keystrokes aimed at a form control, which must not trigger single-key shortcuts. */
export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}
