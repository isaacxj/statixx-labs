import { isIsoDate } from "./dates";
import { parseMoney, parseQty } from "./invoice-math";
import { percentToBp } from "./business-form";

/** One line as the editor holds it: everything is text until it is validated. */
export type DraftItem = { description: string; qty: string; unitPrice: string; taxRate: string };

export type InvoiceInput = {
  businessId: number;
  clientId: number;
  issueDate: string;
  dueDate: string;
  notesMd: string;
  items: { description: string; qtyMilli: number; unitPriceCents: number; taxRateBp: number }[];
};

export type InvoiceErrors = Partial<Record<"businessId" | "clientId" | "issueDate" | "dueDate" | "items", string>>;

const str = (d: FormData, k: string) => String(d.get(k) ?? "").trim();

function parseItems(raw: string): DraftItem[] | null {
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

/** Returns the first problem with a line as a message, or null when the line is valid. */
export function checkItem(i: DraftItem): string | null {
  if (!i.description) return "Every line needs a description.";
  if (parseQty(i.qty) === null) return "Quantity must be above zero, like 2 or 1.5.";
  if (parseMoney(i.unitPrice) === null) return "Unit price must be an amount like 150 or 19.99.";
  if (percentToBp(i.taxRate || "0") === null) return "Tax rate must be from 0 to 100.";
  return null;
}

export function parseInvoiceForm(
  data: FormData,
): { ok: true; value: InvoiceInput } | { ok: false; errors: InvoiceErrors } {
  const errors: InvoiceErrors = {};
  const businessId = Number(str(data, "businessId"));
  if (!Number.isInteger(businessId) || businessId < 1) errors.businessId = "Pick a business.";
  const clientId = Number(str(data, "clientId"));
  if (!Number.isInteger(clientId) || clientId < 1) errors.clientId = "Pick a client.";
  const issueDate = str(data, "issueDate");
  if (!isIsoDate(issueDate)) errors.issueDate = "Enter an issue date.";
  const dueDate = str(data, "dueDate");
  if (!isIsoDate(dueDate)) errors.dueDate = "Enter a due date.";
  else if (isIsoDate(issueDate) && dueDate < issueDate) errors.dueDate = "The due date can't be before the issue date.";

  const drafts = parseItems(str(data, "items"));
  if (!drafts || drafts.length === 0) errors.items = "Add at least one line.";
  else {
    const bad = drafts.map(checkItem).find(Boolean);
    if (bad) errors.items = bad;
  }
  if (Object.keys(errors).length || !drafts) return { ok: false, errors };
  return {
    ok: true,
    value: {
      businessId,
      clientId,
      issueDate,
      dueDate,
      notesMd: str(data, "notes"),
      items: drafts.map((i) => ({
        description: i.description,
        qtyMilli: parseQty(i.qty) as number,
        unitPriceCents: parseMoney(i.unitPrice) as number,
        taxRateBp: percentToBp(i.taxRate || "0") as number,
      })),
    },
  };
}
