import { describe, expect, it } from "vitest";
import { eventLabel, formatEventTime, shouldRecordView } from "./activity";

describe("shouldRecordView", () => {
  it("records the first client view of a sent invoice", () => {
    expect(shouldRecordView({ status: "sent", viewedAt: null, isTeam: false })).toBe(true);
  });
  it("skips team views, repeat views and drafts", () => {
    expect(shouldRecordView({ status: "sent", viewedAt: null, isTeam: true })).toBe(false);
    expect(shouldRecordView({ status: "viewed", viewedAt: "2026-10-09 12:00:00", isTeam: false })).toBe(false);
    expect(shouldRecordView({ status: "draft", viewedAt: null, isTeam: false })).toBe(false);
  });
});

describe("event display", () => {
  it("labels events", () => {
    expect(eventLabel("viewed")).toBe("Client opened the invoice");
    expect(eventLabel("payment", { amountText: "$10.00" })).toBe("Payment of $10.00 recorded");
  });
  it("converts UTC to Central", () => {
    expect(formatEventTime("2026-10-09 18:05:00")).toBe("Oct 9, 1:05 PM");
  });
});
