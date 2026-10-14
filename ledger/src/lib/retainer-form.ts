import { isIsoDate } from "./dates";
import { parseMoney, parseQty } from "./invoice-math";
import { percentToBp } from "./business-form";
import { checkItem, type DraftItem } from "./invoice-form";
import { CADENCES, type Cadence } from "./retainer-schedule";

export type RetainerItem = { description: string; qtyMilli: number; unitPriceCents: number; taxRateBp: number };

export type RetainerInput = {
  businessId: number;
  clientId: number;
  title: string;
  cadence: Cadence;
  anchorDay: number;
  startsOn: string;
  endsOn: string | null;
  active: boolean;
  items: RetainerItem[];
};

export type RetainerErrors = Partial<
  Record<"businessId" | "clientId" | "title" | "anchorDay" | "startsOn" | "endsOn" | "items", string>
>;

const str = (d: FormData, k: string) => String(d.get(k) ?? "").trim();

function parseDrafts(raw: string): DraftItem[] | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return null;
    return v.map((i) => {
      const o = (i ?? {}) as Record<string, unknown>;
      return {
        description: String(o.description ?? "").trim(),
        qty: String(o.qty ?? ""),
        unitPrice: String(o.unitPrice ?? ""),
        taxRate: String(o.taxRate ?? ""),
      };
    });
  } catch {
    return null;
  }
}

export function parseRetainerForm(
  data: FormData,
): { ok: true; value: RetainerInput } | { ok: false; errors: RetainerErrors } {
  const errors: RetainerErrors = {};
  const businessId = Number(str(data, "businessId"));
  if (!Number.isInteger(businessId) || businessId < 1) errors.businessId = "Pick a business.";
  const clientId = Number(str(data, "clientId"));
  if (!Number.isInteger(clientId) || clientId < 1) errors.clientId = "Pick a client.";
  const title = str(data, "title");
  if (!title) errors.title = "Enter a title.";
  const cadence = str(data, "cadence") as Cadence;
  const anchorDay = Number(str(data, "anchorDay"));
  if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) errors.anchorDay = "Enter a day from 1 to 31.";
  const startsOn = str(data, "startsOn");
  if (!isIsoDate(startsOn)) errors.startsOn = "Enter a start date.";
  const endsOn = str(data, "endsOn");
  if (endsOn && !isIsoDate(endsOn)) errors.endsOn = "Enter a valid end date or leave it empty.";
  else if (endsOn && isIsoDate(startsOn) && endsOn < startsOn) errors.endsOn = "The end date can't be before the start date.";

  const drafts = parseDrafts(str(data, "items"));
  if (!drafts || drafts.length === 0) errors.items = "Add at least one line.";
  else {
    const bad = drafts.map(checkItem).find(Boolean);
    if (bad) errors.items = bad;
  }
  if (Object.keys(errors).length || !drafts || !CADENCES.includes(cadence)) {
    return { ok: false, errors: Object.keys(errors).length ? errors : { items: "Pick a cadence." } };
  }
  return {
    ok: true,
    value: {
      businessId,
      clientId,
      title,
      cadence,
      anchorDay,
      startsOn,
      endsOn: endsOn || null,
      active: data.get("active") === "on",
      items: drafts.map((i) => ({
        description: i.description,
        qtyMilli: parseQty(i.qty) as number,
        unitPriceCents: parseMoney(i.unitPrice) as number,
        taxRateBp: percentToBp(i.taxRate || "0") as number,
      })),
    },
  };
}
