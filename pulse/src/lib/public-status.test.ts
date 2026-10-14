import { describe, expect, it } from "vitest";
import { overallStatus, publicIncidentTitle, safeAccent } from "./public-status";

describe("overallStatus", () => {
  it("is operational when nothing is down", () => {
    expect(overallStatus(["up", "up"])).toBe("operational");
    expect(overallStatus([])).toBe("operational");
  });
  it("is partial when some checked monitors are down", () => {
    expect(overallStatus(["up", "down"])).toBe("partial");
  });
  it("is major when every checked monitor is down", () => {
    expect(overallStatus(["down", "down", "paused"])).toBe("major");
  });
  it("ignores pending and paused monitors", () => {
    expect(overallStatus(["pending", "paused"])).toBe("operational");
  });
});

describe("safeAccent", () => {
  it("keeps a hex color and replaces anything else", () => {
    expect(safeAccent("#0ea5e9")).toBe("#0ea5e9");
    expect(safeAccent("red; background:url(x)")).toBe("#f43f5e");
  });
});

describe("publicIncidentTitle", () => {
  it("hides raw errors from automatic incidents", () => {
    expect(publicIncidentTitle({ title: "Booking API is down: Timed out", auto: true }, "Online booking")).toBe("Online booking is unavailable");
    expect(publicIncidentTitle({ title: "Planned database upgrade", auto: false }, "Website")).toBe("Planned database upgrade");
  });
});
