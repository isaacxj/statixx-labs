import { describe, expect, it } from "vitest";
import { cleanPageMonitors, parseStatusPageForm, slugify } from "./status-page-form";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("slugify", () => {
  it("makes url-safe slugs", () => {
    expect(slugify("Park & Sons Roofing!")).toBe("park-and-sons-roofing");
    expect(slugify("  --Northwind  Dental-- ")).toBe("northwind-dental");
  });
});

describe("parseStatusPageForm", () => {
  it("derives the slug from the title and defaults the accent", () => {
    const r = parseStatusPageForm(form({ title: "Northwind Dental", slug: "", accent: "" }));
    expect(r).toEqual({ ok: true, value: { title: "Northwind Dental", slug: "northwind-dental", accent: "#f43f5e", introMd: "" } });
  });
  it("rejects bad input", () => {
    const r = parseStatusPageForm(form({ title: "", slug: "new", accent: "red" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["accent", "slug", "title"]);
  });
  it("rejects reserved slugs", () => {
    const r = parseStatusPageForm(form({ title: "X", slug: "admin" }));
    expect(r.ok).toBe(false);
  });
});

describe("cleanPageMonitors", () => {
  const names = new Map([[1, "Marketing site"], [2, "Booking API"]]);
  it("falls back to the monitor name, drops unknown and duplicate monitors, keeps order", () => {
    const out = cleanPageMonitors(
      [{ monitorId: 2, displayName: " Bookings " }, { monitorId: 9, displayName: "x" }, { monitorId: 1, displayName: " " }, { monitorId: 2, displayName: "dup" }],
      names,
    );
    expect(out).toEqual([{ monitorId: 2, displayName: "Bookings" }, { monitorId: 1, displayName: "Marketing site" }]);
  });
});
