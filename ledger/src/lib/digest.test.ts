import { describe, expect, it } from "vitest";
import { buildMime, digestSubject, digestText, parseRecipient, sumLabel, type DigestData, type DigestInvoice } from "./digest";

const inv = (o: Partial<DigestInvoice>): DigestInvoice => ({
  id: 1, number: "STX-0001", clientName: "Maria Alvarez", businessName: "Statixx", currency: "USD",
  dueDate: "2026-10-01", balanceCents: 120000, ...o,
});

const data: DigestData = {
  overdue: [inv({}), inv({ id: 2, number: "APT-0001", businessName: "Aptixx", currency: "CAD", dueDate: "2026-10-09", balanceCents: 30000 })],
  dueSoon: [inv({ id: 3, number: "STX-0002", dueDate: "2026-10-14", balanceCents: 5000 })],
  newRetainer: [],
};

describe("digest", () => {
  it("lists overdue days, balances and due dates", () => {
    const text = digestText(data, "2026-10-10");
    expect(text).toContain("Overdue (2, $1,200.00 + CA$300.00 outstanding)");
    expect(text).toContain("- STX-0001 · Maria Alvarez (Statixx) · $1,200.00 · 9 days overdue");
    expect(text).toContain("APT-0001 · Maria Alvarez (Aptixx) · CA$300.00 · 1 day overdue");
    expect(text).toContain("Due this week (1, $50.00)\n- STX-0002 · Maria Alvarez (Statixx) · $50.00 · due Oct 14, 2026");
    expect(text).not.toContain("New retainer");
  });

  it("summarises the subject and handles a quiet day", () => {
    expect(digestSubject(data, "2026-10-10")).toBe("Ledger · Oct 10, 2026 · 2 overdue, 1 due this week");
    const empty: DigestData = { overdue: [], dueSoon: [], newRetainer: [] };
    expect(digestSubject(empty, "2026-10-10")).toContain("nothing needs attention");
    expect(digestText(empty, "2026-10-10")).toContain("nothing due by Oct 17, 2026");
  });

  it("totals per currency", () => {
    expect(sumLabel([])).toBe("$0.00");
    expect(sumLabel(data.overdue)).toBe("$1,200.00 + CA$300.00");
  });

  it("validates the recipient", () => {
    expect(parseRecipient("  isaac@example.com ")).toEqual({ ok: true, value: "isaac@example.com" });
    expect(parseRecipient("")).toEqual({ ok: true, value: "" });
    expect(parseRecipient("nope").ok).toBe(false);
  });

  it("builds a base64 plain-text message", () => {
    const mime = buildMime({ from: "a@b.co", to: "c@d.co", subject: "Ledger · today", text: "Héllo", messageId: "x@b.co" });
    expect(mime).toContain("To: c@d.co");
    expect(mime).toContain("Subject: =?UTF-8?B?");
    expect(mime).toContain("Content-Transfer-Encoding: base64");
    const body = mime.split("\r\n\r\n")[1].trim();
    expect(new TextDecoder().decode(Uint8Array.from(atob(body), (c) => c.charCodeAt(0)))).toBe("Héllo");
  });
});
