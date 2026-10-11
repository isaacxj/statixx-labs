import { describe, expect, it } from "vitest";
import { groupUnbilled, lineAmountCents, unbilledCsv, type UnbilledEntry } from "./unbilled";

const e = (over: Partial<UnbilledEntry>): UnbilledEntry => ({
  id: 1, startedAt: "2026-10-07T15:00:00.000Z", minutes: 90, description: "", projectId: 1, projectName: "Site",
  billing: "hourly", rateCents: 10000, clientId: 1, clientName: "Acme", currency: "USD", ...over,
});

describe("unbilled", () => {
  it("prices hourly lines at hours x rate and leaves other billing blank", () => {
    expect(lineAmountCents(e({}))).toBe(15000);
    expect(lineAmountCents(e({ minutes: 7, rateCents: 12345 }))).toBe(1440);
    expect(lineAmountCents(e({ billing: "fixed" }))).toBeNull();
  });

  it("groups by client and project with totals", () => {
    const g = groupUnbilled([
      e({ id: 1 }),
      e({ id: 2, minutes: 30 }),
      e({ id: 3, projectId: 2, projectName: "Retainer", billing: "retainer", minutes: 60 }),
      e({ id: 4, clientId: 2, clientName: "Beta", minutes: 60, rateCents: 5000 }),
    ]);
    expect(g.map((c) => c.name)).toEqual(["Acme", "Beta"]);
    expect(g[0]).toMatchObject({ minutes: 180, amountCents: 20000, maxEntryId: 3 });
    expect(g[0].projects.map((p) => [p.name, p.amountCents])).toEqual([["Retainer", null], ["Site", 20000]]);
    expect(g[1].amountCents).toBe(5000);
  });

  it("exports lines whose amounts add up to the total row", () => {
    const csv = unbilledCsv([e({}), e({ id: 2, minutes: 30, description: 'Fix "nav", footer' })]);
    expect(csv.split("\r\n")).toEqual([
      "Date,Project,Description,Hours,Rate,Amount",
      "2026-10-07,Site,,1.50,100.00,150.00",
      '2026-10-07,Site,"Fix ""nav"", footer",0.50,100.00,50.00',
      "Total,,,2.00,,200.00",
      "",
    ]);
  });
});
