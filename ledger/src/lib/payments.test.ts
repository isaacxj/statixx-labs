import { describe, expect, it } from "vitest";
import { balanceCents, canRecordPayment, parsePaymentForm, statusAfterPayment } from "./payments";

function form(over: Record<string, string> = {}) {
  const d = new FormData();
  const base = { amount: "400.00", paidOn: "2026-10-09", method: "e_transfer", reference: "ref 1", ...over };
  for (const [k, v] of Object.entries(base)) d.set(k, v);
  return d;
}

describe("payments", () => {
  it("two partial payments that add up to the total settle the invoice", () => {
    const total = 100000;
    const first = 40000;
    expect(statusAfterPayment(total, first)).toBe("partially_paid");
    expect(balanceCents(total, first)).toBe(60000);
    expect(statusAfterPayment(total, first + 60000)).toBe("paid");
  });

  it("records only against issued, unsettled invoices", () => {
    for (const s of ["sent", "viewed", "partially_paid", "overdue"] as const) expect(canRecordPayment(s)).toBe(true);
    for (const s of ["draft", "paid", "void"] as const) expect(canRecordPayment(s)).toBe(false);
  });

  it("parses a valid payment", () => {
    const r = parsePaymentForm(form(), 100000, "2026-10-10");
    expect(r).toEqual({ ok: true, value: { amountCents: 40000, paidOn: "2026-10-09", method: "e_transfer", reference: "ref 1" } });
  });

  it("rejects zero, overpayment, future dates and unknown methods", () => {
    expect(parsePaymentForm(form({ amount: "0" }), 1000, "2026-10-10")).toMatchObject({ ok: false, errors: { amount: expect.any(String) } });
    expect(parsePaymentForm(form({ amount: "10.01" }), 1000, "2026-10-10")).toMatchObject({ ok: false, errors: { amount: expect.any(String) } });
    expect(parsePaymentForm(form({ amount: "10.00" }), 1000, "2026-10-10").ok).toBe(true);
    expect(parsePaymentForm(form({ paidOn: "2026-10-11" }), 100000, "2026-10-10")).toMatchObject({ ok: false, errors: { paidOn: expect.any(String) } });
    expect(parsePaymentForm(form({ method: "bitcoin" }), 100000, "2026-10-10")).toMatchObject({ ok: false, errors: { method: expect.any(String) } });
  });
});
