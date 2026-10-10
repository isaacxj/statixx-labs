import { describe, expect, it } from "vitest";
import { canSend, canVoid, parseTab, statusTone, tabStatuses } from "./invoice-status";

describe("invoice status rules", () => {
  it("only drafts can be sent", () => {
    expect(canSend("draft")).toBe(true);
    expect(canSend("sent")).toBe(false);
    expect(canSend("void")).toBe(false);
  });

  it("voids anything unpaid, but not paid, void, or invoices with money received", () => {
    expect(canVoid("draft", 0)).toBe(true);
    expect(canVoid("overdue", 0)).toBe(true);
    expect(canVoid("partially_paid", 5000)).toBe(false);
    expect(canVoid("paid", 0)).toBe(false);
    expect(canVoid("void", 0)).toBe(false);
  });

  it("falls back to all for unknown tabs and groups issued statuses under sent", () => {
    expect(parseTab("nope")).toBe("all");
    expect(parseTab(undefined)).toBe("all");
    expect(parseTab("void")).toBe("void");
    expect(tabStatuses("all")).toBeNull();
    expect(tabStatuses("sent")).toEqual(["sent", "viewed", "partially_paid"]);
  });

  it("marks void invoices neutral and overdue ones danger", () => {
    expect(statusTone("void")).toBe("neutral");
    expect(statusTone("overdue")).toBe("danger");
  });
});
