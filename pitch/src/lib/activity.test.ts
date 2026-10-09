import { describe, expect, it } from "vitest";
import { describeEvent, isTeamRequest, statusAfterView } from "./activity";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

describe("isTeamRequest", () => {
  it("flags the Access identity header", () => expect(isTeamRequest(h({ "cf-access-authenticated-user-email": "a@b.c" }))).toBe(true));
  it("flags the Access session cookie", () => expect(isTeamRequest(h({ cookie: "x=1; CF_Authorization=abc" }))).toBe(true));
  it("treats anonymous visitors as clients", () => expect(isTeamRequest(h({ cookie: "x=1" }))).toBe(false));
});

describe("statusAfterView", () => {
  it("moves sent to viewed", () => expect(statusAfterView("sent")).toBe("viewed"));
  it("leaves other statuses alone", () => {
    for (const s of ["draft", "viewed", "accepted", "declined", "expired"]) expect(statusAfterView(s)).toBe(s);
  });
});

describe("describeEvent", () => {
  it("labels plain events", () => expect(describeEvent("sent", null)).toBe("Sent to client"));
  it("shows repeat view numbers", () => expect(describeEvent("viewed", '{"n":3}')).toBe("Opened by client (view 3)"));
  it("ignores bad meta", () => expect(describeEvent("viewed", "{nope")).toBe("Opened by client"));
});
