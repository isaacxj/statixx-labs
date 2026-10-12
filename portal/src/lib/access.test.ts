import { describe, expect, it } from "vitest";
import { canDecideApproval, canSeeClient, type CurrentUser } from "./access";

const team: CurrentUser = { kind: "team", email: "t@x.com", initials: "T" };
const maria: CurrentUser = { kind: "client", email: "m@n.com", initials: "M", clientId: 1, clientName: "Northwind", role: "approver" };
const desk: CurrentUser = { ...maria, email: "d@n.com", role: "viewer" };
const stranger: CurrentUser = { kind: "none", email: "x@y.com", initials: "X" };

describe("access", () => {
  it("lets the team see every client", () => {
    expect(canSeeClient(team, 1)).toBe(true);
    expect(canSeeClient(team, 2)).toBe(true);
  });
  it("limits a client user to their own client", () => {
    expect(canSeeClient(maria, 1)).toBe(true);
    expect(canSeeClient(maria, 2)).toBe(false);
  });
  it("gives unknown emails no access", () => {
    expect(canSeeClient(stranger, 1)).toBe(false);
  });
  it("lets only approvers decide approvals", () => {
    expect(canDecideApproval(maria)).toBe(true);
    expect(canDecideApproval(desk)).toBe(false);
    expect(canDecideApproval(team)).toBe(false);
  });
});
