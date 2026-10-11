import { describe, expect, it } from "vitest";
import { groupProjects, sanitizeRows, parseClock, parseCsv, parseDay, parseDurationText, parseTimeExport, rowTimes, suggestProject } from "./import";

const toggl = `User,Email,Client,Project,Task,Description,Billable,Start date,Start time,End date,End time,Duration,Tags,Amount ()
Isaac,i@x.com,Acme,Website,,"Homepage, hero",Yes,2026-10-05,09:00:00,2026-10-05,10:30:00,01:30:00,,
Isaac,i@x.com,Acme,Website,,Footer,No,2026-10-05,13:00:00,2026-10-05,13:20:29,00:20:29,,
Isaac,i@x.com,,Admin,,"Said ""hi""",Yes,2026-10-06,08:00:00,2026-10-06,08:00:10,00:00:10,,
`;

const clockify = `"Project","Client","Description","Task","User","Group","Email","Tags","Billable","Start Date","Start Time","End Date","End Time","Duration (h)","Duration (decimal)"
"Website","Acme","Nav","","Isaac","","i@x.com","","Yes","10/07/2026","9:15:00 AM","10/07/2026","11:00:00 AM","01:45:00","1.75"
"Admin","","Invoices","","Isaac","","i@x.com","","No","10/07/2026","2:00:00 PM","10/07/2026","2:30:00 PM","","0.5"
`;

describe("parseCsv", () => {
  it("handles quoted commas, doubled quotes, and CRLF", () => {
    expect(parseCsv('a,"b,c","d ""e"""\r\n1,2,3\r\n')).toEqual([
      ["a", "b,c", 'd "e"'],
      ["1", "2", "3"],
    ]);
  });
});

describe("cell parsers", () => {
  it("reads both date styles", () => {
    expect(parseDay("2026-10-05")).toBe("2026-10-05");
    expect(parseDay("10/5/2026")).toBe("2026-10-05");
    expect(parseDay("5 Oct")).toBeNull();
  });
  it("reads 24-hour and 12-hour clocks", () => {
    expect(parseClock("14:30:00")).toBe("14:30");
    expect(parseClock("2:30:00 PM")).toBe("14:30");
    expect(parseClock("12:05 AM")).toBe("00:05");
    expect(parseClock("25:00")).toBeNull();
  });
  it("rounds seconds to the nearest minute", () => {
    expect(parseDurationText("01:30:00")).toBe(90);
    expect(parseDurationText("00:20:29")).toBe(20);
    expect(parseDurationText("00:20:30")).toBe(21);
    expect(parseDurationText("")).toBeNull();
  });
});

describe("parseTimeExport", () => {
  it("imports a Toggl export with correct durations and skips sub-minute rows", () => {
    const r = parseTimeExport(toggl);
    expect(r.ok && r.data.source).toBe("Toggl");
    if (!r.ok) return;
    expect(r.data.skipped).toBe(1);
    expect(r.data.rows.map((x) => x.minutes)).toEqual([90, 20]);
    expect(r.data.rows[0]).toMatchObject({ client: "Acme", project: "Website", description: "Homepage, hero", day: "2026-10-05", time: "09:00", billable: true });
    expect(r.data.rows[1].billable).toBe(false);
  });

  it("imports a Clockify export, falling back to decimal hours", () => {
    const r = parseTimeExport(clockify);
    expect(r.ok && r.data.source).toBe("Clockify");
    if (!r.ok) return;
    expect(r.data.rows.map((x) => x.minutes)).toEqual([105, 30]);
    expect(r.data.rows[0]).toMatchObject({ day: "2026-10-07", time: "09:15" });
    expect(r.data.rows[1]).toMatchObject({ client: "", time: "14:00", billable: false });
  });

  it("rejects files that aren't time exports", () => {
    expect(parseTimeExport("a,b\n1,2").ok).toBe(false);
    expect(parseTimeExport("").ok).toBe(false);
  });
});

describe("grouping and mapping", () => {
  const r = parseTimeExport(toggl);
  const rows = r.ok ? r.data.rows : [];
  it("groups rows by client and project with totals", () => {
    expect(groupProjects(rows)).toEqual([{ key: "Acme\u0000Website", client: "Acme", project: "Website", count: 2, minutes: 110 }]);
  });
  it("suggests an existing project by name and client, ignoring case", () => {
    const projects = [
      { id: 1, name: "website", clientName: "Beta" },
      { id: 2, name: "Website", clientName: "ACME" },
    ];
    expect(suggestProject({ client: "Acme", project: "Website" }, projects)).toBe(2);
    expect(suggestProject({ client: "Gamma", project: "Website" }, projects)).toBeNull();
    expect(suggestProject({ client: "", project: "Website" }, projects)).toBe(1);
  });
  it("converts Central wall-clock starts to UTC", () => {
    expect(rowTimes({ day: "2026-10-05", time: "09:00", minutes: 90 })).toEqual({
      startedAt: "2026-10-05T14:00:00.000Z",
      endedAt: "2026-10-05T15:30:00.000Z",
    });
  });
});

describe("sanitizeRows", () => {
  it("drops malformed rows and clamps text", () => {
    const good = { client: "A", project: "P", description: "x".repeat(300), day: "2026-10-05", time: "09:00", minutes: 30, billable: true };
    const out = sanitizeRows([good, { ...good, day: "bad" }, { ...good, minutes: 0 }, { ...good, minutes: 1.5 }, null, "x"]);
    expect(out).toHaveLength(1);
    expect(out[0].description).toHaveLength(200);
    expect(sanitizeRows("nope")).toEqual([]);
  });
});
