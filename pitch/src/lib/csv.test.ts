import { describe, expect, it } from "vitest";
import { lineRows, proposalRows, toCsv, type ExportLine, type ExportProposal } from "./csv";

const base: ExportProposal = {
  id: 1, number: "STX-2026-001", title: "Site, \"v2\"", status: "accepted", currency: "USD", clientName: "Ada", clientCompany: "Acme",
  businessName: "Statixx", discountBp: 1000, taxRateBp: 500, validUntil: "2026-12-01", sentAt: null, firstViewedAt: null, viewCount: 2,
  acceptedAt: null, acceptedByName: null, declinedAt: null, declineReason: null,
  items: [
    { qtyMilli: 2000, unitPriceCents: 10000, recurring: "none", optional: false, selected: false },
    { qtyMilli: 1000, unitPriceCents: 5000, recurring: "none", optional: true, selected: false },
    { qtyMilli: 1000, unitPriceCents: 3000, recurring: "monthly", optional: false, selected: false },
  ],
};

describe("toCsv", () => {
  it("quotes commas, quotes and newlines, with BOM and CRLF", () => {
    expect(toCsv(["a", "b"], [["x,y", 'say "hi"'], ["l1\nl2", null]])).toBe('﻿a,b\r\n"x,y","say ""hi"""\r\n"l1\nl2",\r\n');
  });
  it("defuses spreadsheet formulas in text but leaves numbers alone", () => {
    expect(toCsv(["a"], [["=SUM(A1)"], ["-5 off"], [-5]])).toBe("﻿a\r\n'=SUM(A1)\r\n'-5 off\r\n-5\r\n");
  });
});

describe("proposalRows", () => {
  it("totals one-time and monthly after discount and tax, skipping unselected optional items", () => {
    const [row] = proposalRows([base]);
    expect(row.slice(-2)).toEqual(["189.00", "28.35"]); // 200 - 10% = 180, +5% = 189; 30 - 10% = 27, +5% = 28.35
  });
});

describe("lineRows", () => {
  it("lists each line with its proposal number and inclusion", () => {
    const lines: ExportLine[] = base.items.map((i, n) => ({ ...i, proposalId: 1, sectionTitle: "Pricing", description: `Item ${n + 1}` }));
    const rows = lineRows([base], [...lines, { ...lines[0], proposalId: 99 }]);
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(["STX-2026-001", base.title, "Pricing", "Item 2", "1", "50.00", "One-time", "Yes", "No", "50.00"]);
    expect(rows[2][6]).toBe("Monthly");
  });
});
