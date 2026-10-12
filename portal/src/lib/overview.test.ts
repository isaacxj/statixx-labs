import { describe, expect, it } from "vitest";
import { splitWaiting, summarizeClients } from "./overview";

const projects = [
  { id: 1, clientId: 10, name: "Site", status: "on_track" as const },
  { id: 2, clientId: 10, name: "Brand", status: "blocked" as const },
  { id: 3, clientId: 20, name: "App", status: "done" as const },
];

describe("splitWaiting", () => {
  const w = splitWaiting(
    projects,
    [
      { id: 5, projectId: 2, title: "Logo", createdAt: "2026-10-02 10:00:00" },
      { id: 4, projectId: 1, title: "Homepage", createdAt: "2026-10-01 09:00:00" },
    ],
    [
      { id: 7, projectId: 3, title: "Add FAQ", status: "open", createdAt: "2026-10-03 08:00:00" },
      { id: 8, projectId: 3, title: "Fix typo", status: "done", createdAt: "2026-10-01 08:00:00" },
      { id: 9, projectId: 1, title: "New banner", status: "in_progress", createdAt: "2026-10-02 08:00:00" },
    ],
  );
  it("puts pending approvals under the client, oldest first", () => {
    expect(w.waitingOnClient.map((i) => i.title)).toEqual(["Homepage", "Logo"]);
  });
  it("puts open and in-progress requests under us and skips done ones", () => {
    expect(w.waitingOnUs.map((i) => i.title)).toEqual(["New banner", "Add FAQ"]);
  });
});

describe("summarizeClients", () => {
  it("counts statuses and open items and finds the newest activity", () => {
    const waiting = splitWaiting(
      projects,
      [{ id: 4, projectId: 1, title: "Homepage", createdAt: "2026-10-01 09:00:00" }],
      [{ id: 7, projectId: 3, title: "Add FAQ", status: "open", createdAt: "2026-10-03 08:00:00" }],
    );
    const [a, b, c] = summarizeClients(
      [10, 20, 30],
      projects,
      waiting,
      [
        { clientId: 10, at: "2026-10-01 09:00:00" },
        { clientId: 10, at: "2026-10-05 12:00:00" },
      ],
    );
    expect(a).toMatchObject({ openApprovals: 1, openRequests: 0, lastActivity: "2026-10-05 12:00:00" });
    expect(a.projectCounts).toEqual({ on_track: 1, at_risk: 0, blocked: 1, done: 0 });
    expect(b).toMatchObject({ openApprovals: 0, openRequests: 1, lastActivity: null });
    expect(c.lastActivity).toBeNull();
  });
});
