import type { Recurring, SectionKind } from "@/server/db/schema";

export type SnapshotItem = {
  description: string;
  qtyMilli: number;
  unitPriceCents: number;
  recurring: Recurring;
  optional: boolean;
};
export type SnapshotSection = { kind: SectionKind; title: string; bodyMd: string; items: SnapshotItem[] };
export type Snapshot = { discountBp: number; taxRateBp: number; sections: SnapshotSection[] };

type SectionSource = { id: number; kind: SectionKind; title: string; bodyMd: string };
type ItemSource = SnapshotItem & { sectionId: number };

/** Captures a proposal's content (never its client, number, status or dates) so it can be replayed later. */
export function buildSnapshot(
  terms: { discountBp: number; taxRateBp: number },
  sections: SectionSource[],
  items: ItemSource[],
): Snapshot {
  return {
    discountBp: terms.discountBp,
    taxRateBp: terms.taxRateBp,
    sections: sections.map((s) => ({
      kind: s.kind,
      title: s.title,
      bodyMd: s.bodyMd,
      items: items
        .filter((i) => i.sectionId === s.id)
        .map(({ description, qtyMilli, unitPriceCents, recurring, optional }) => ({ description, qtyMilli, unitPriceCents, recurring, optional })),
    })),
  };
}

const int = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Reads stored JSON defensively; anything malformed degrades to an empty template rather than throwing. */
export function parseSnapshot(json: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    raw = null;
  }
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const list = Array.isArray(o.sections) ? o.sections : [];
  return {
    discountBp: Math.max(0, int(o.discountBp, 0)),
    taxRateBp: Math.max(0, int(o.taxRateBp, 0)),
    sections: list.map((s): SnapshotSection => {
      const sec = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
      const kind: SectionKind = sec.kind === "pricing" ? "pricing" : "text";
      const items = kind === "pricing" && Array.isArray(sec.items) ? sec.items : [];
      return {
        kind,
        title: str(sec.title),
        bodyMd: str(sec.bodyMd),
        items: items.map((i): SnapshotItem => {
          const it = (i && typeof i === "object" ? i : {}) as Record<string, unknown>;
          return {
            description: str(it.description),
            qtyMilli: Math.max(0, int(it.qtyMilli, 1000)),
            unitPriceCents: Math.max(0, int(it.unitPriceCents, 0)),
            recurring: it.recurring === "monthly" ? "monthly" : "none",
            optional: it.optional === true,
          };
        }),
      };
    }),
  };
}

export function cleanTemplateName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 80) || "Untitled template";
}

export function copyTitle(title: string): string {
  return `Copy of ${title}`.slice(0, 120);
}
