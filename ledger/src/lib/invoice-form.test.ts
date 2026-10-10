import { describe, expect, it } from "vitest";
import { addDays, isIsoDate } from "./dates";
import { parseInvoiceForm } from "./invoice-form";

function form(over: Record<string, string> = {}) {
  const d = new FormData();
  const base: Record<string, string> = {
    businessId: "1",
    clientId: "2",
    issueDate: "2026-10-09",
    dueDate: "2026-11-08",
    notes: "",
    items: JSON.stringify([{ description: "Website", qty: "1.5", unitPrice: "1,200.00", taxRate: "13" }]),
    ...over,
  };
  for (const [k, v] of Object.entries(base)) d.set(k, v);
  return d;
}

describe("parseInvoiceForm", () => {
  it("converts text fields to integer units", () => {
    const r = parseInvoiceForm(form());
    expect(r.ok && r.value.items[0]).toEqual({ description: "Website", qtyMilli: 1500, unitPriceCents: 120000, taxRateBp: 1300 });
  });

  it("rejects an empty invoice, a bad line, and a due date before the issue date", () => {
    expect(parseInvoiceForm(form({ items: "[]" }))).toMatchObject({ ok: false, errors: { items: expect.any(String) } });
    expect(parseInvoiceForm(form({ items: JSON.stringify([{ description: "", qty: "1", unitPrice: "5", taxRate: "" }]) }))).toMatchObject({ ok: false });
    expect(parseInvoiceForm(form({ dueDate: "2026-10-01" }))).toMatchObject({ ok: false, errors: { dueDate: expect.any(String) } });
  });
});

describe("dates", () => {
  it("adds days across month ends and validates real dates", () => {
    expect(addDays("2026-10-09", 30)).toBe("2026-11-08");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(isIsoDate("2026-02-30")).toBe(false);
  });
});
