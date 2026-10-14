import { describe, expect, it } from "vitest";
import { formatCheckedAt, formatInterval, formatLatency } from "./monitors";

describe("monitor formatting", () => {
  it("rounds latency to whole milliseconds", () => {
    expect(formatLatency(123.6)).toBe("124 ms");
    expect(formatLatency(null)).toBe("–");
  });

  it("describes intervals in minutes when they divide evenly", () => {
    expect(formatInterval(300)).toBe("Every 5 min");
    expect(formatInterval(90)).toBe("Every 90 s");
  });

  it("shows UTC timestamps in Chicago time", () => {
    expect(formatCheckedAt("2026-10-12 18:00:00")).toBe("Oct 12, 1:00 PM");
    expect(formatCheckedAt(null)).toBe("Not checked yet");
  });
});
