import { describe, expect, it } from "vitest";
import { canExpire, cleanValidUntil, daysSince, isPastValidUntil, needsFollowUp } from "./expiry";

describe("expiry", () => {
  it("expires the day after valid-until, Chicago time", () => {
    expect(isPastValidUntil("2026-10-09", new Date("2026-10-10T04:00:00Z"))).toBe(false); // Oct 9 11pm Chicago
    expect(isPastValidUntil("2026-10-09", new Date("2026-10-10T05:30:00Z"))).toBe(true); // Oct 10 00:30 Chicago
    expect(isPastValidUntil(null, new Date())).toBe(false);
  });
  it("only sent and viewed can lapse", () => {
    expect(["draft", "sent", "viewed", "accepted", "declined", "expired"].filter(canExpire)).toEqual(["sent", "viewed"]);
  });
  it("flags viewed proposals quiet for 3+ days", () => {
    const now = new Date("2026-10-09T12:00:00Z");
    expect(needsFollowUp("viewed", "2026-10-06 12:00:00", now)).toBe(true);
    expect(needsFollowUp("viewed", "2026-10-06 12:00:01", now)).toBe(false);
    expect(needsFollowUp("sent", "2026-10-01 12:00:00", now)).toBe(false);
    expect(needsFollowUp("accepted", "2026-10-01 12:00:00", now)).toBe(false);
    expect(needsFollowUp("viewed", null, now)).toBe(false);
    expect(daysSince("2026-10-05 12:00:00", now)).toBe(4);
  });
  it("cleans the date input", () => {
    expect(cleanValidUntil("")).toBeNull();
    expect(cleanValidUntil("2026-11-30")).toBe("2026-11-30");
    expect(cleanValidUntil("2026-02-30")).toBeUndefined();
    expect(cleanValidUntil("soon")).toBeUndefined();
  });
});
