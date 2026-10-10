import { describe, expect, it } from "vitest";
import { runDates, type Schedule } from "./retainer-schedule";

const base: Schedule = { cadence: "monthly", anchorDay: 31, startsOn: "2027-01-01", endsOn: null };

describe("runDates", () => {
  it("runs an anchor on the 31st on Feb 28 and Apr 30", () => {
    expect(runDates(base, 4, "2027-01-01")).toEqual(["2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30"]);
  });

  it("uses Feb 29 in a leap year", () => {
    expect(runDates({ ...base, startsOn: "2028-01-01" }, 2, "2028-02-01")).toEqual(["2028-02-29", "2028-03-31"]);
  });

  it("skips this month's run when the start date is already past the anchor", () => {
    expect(runDates({ ...base, anchorDay: 5, startsOn: "2027-01-10" }, 2, "2027-01-01")).toEqual(["2027-02-05", "2027-03-05"]);
  });

  it("keeps quarterly runs three months apart across a year end", () => {
    const s: Schedule = { cadence: "quarterly", anchorDay: 15, startsOn: "2027-11-01", endsOn: null };
    expect(runDates(s, 3, "2027-11-01")).toEqual(["2027-11-15", "2028-02-15", "2028-05-15"]);
  });

  it("starts after the given date and stops at the end date", () => {
    const s: Schedule = { ...base, anchorDay: 1, endsOn: "2027-04-01" };
    expect(runDates(s, 5, "2027-02-02")).toEqual(["2027-03-01", "2027-04-01"]);
  });
});
