import { describe, expect, it } from "vitest";
import { buildDigest, sinceUtc, type DigestData } from "./digest";

const base: DigestData = {
  projects: [
    { id: 1, name: "Website", clientName: "Northwind" },
    { id: 2, name: "Brand", clientName: "Acme" },
  ],
  requests: [
    { id: 1, projectId: 1, title: "Swap hero photo", authorEmail: "a@northwind.test", status: "open", createdAt: "2026-10-12 09:00:00" },
    { id: 2, projectId: 2, title: "Old ask", authorEmail: "b@acme.test", status: "open", createdAt: "2026-10-01 09:00:00" },
  ],
  approvals: [
    { id: 1, projectId: 1, title: "Homepage", status: "approved", decidedBy: "a@northwind.test", decidedAt: "2026-10-12 12:00:00" },
    { id: 2, projectId: 2, title: "Logo", status: "pending", decidedBy: null, decidedAt: null },
    { id: 3, projectId: 2, title: "Palette", status: "changes_requested", decidedBy: "b@acme.test", decidedAt: "2026-10-02 12:00:00" },
  ],
  milestones: [
    { id: 1, projectId: 1, title: "Launch", dueOn: "2026-10-10", doneOn: null },
    { id: 2, projectId: 1, title: "Kickoff", dueOn: "2026-10-01", doneOn: "2026-10-01" },
    { id: 3, projectId: 2, title: "Draft", dueOn: "2026-10-12", doneOn: null },
  ],
};

describe("buildDigest", () => {
  const d = buildDigest(base, "2026-10-12 00:00:00", "2026-10-12");
  it("includes only requests and decisions since the cutoff", () => {
    expect(d.newRequests.map((l) => l.title)).toEqual(["Swap hero photo"]);
    expect(d.decisions.map((l) => l.title)).toEqual(["Homepage"]);
  });
  it("lists overdue milestones that are not done, and skips ones due today", () => {
    expect(d.overdueMilestones.map((l) => l.title)).toEqual(["Launch"]);
    expect(d.overdueMilestones[0].detail).toBe("due 2026-10-10 · 2 days late");
  });
  it("writes a subject and plain-text body", () => {
    expect(d.subject).toBe("Portal digest: 1 new request, 1 decision, 1 overdue");
    expect(d.text).toContain("- Northwind / Website: Swap hero photo");
  });
  it("says so when nothing happened", () => {
    const empty = buildDigest({ ...base, requests: [], approvals: [], milestones: [] }, "2026-10-12 00:00:00", "2026-10-12");
    expect(empty.total).toBe(0);
    expect(empty.subject).toBe("Portal digest: nothing new");
  });
});

describe("sinceUtc", () => {
  it("steps back 24 hours in stored format", () => {
    expect(sinceUtc(new Date("2026-10-12T13:00:00Z"))).toBe("2026-10-11 13:00:00");
  });
});
