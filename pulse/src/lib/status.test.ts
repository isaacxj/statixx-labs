import { describe, expect, it } from "vitest";
import { formatDuration, nextMonitorState, type MonitorState } from "./status";

// Feeds a sequence of check results through the status rules, collecting incident actions.
function run(start: MonitorState, results: boolean[]) {
  let state = start;
  const actions: (string | null)[] = [];
  for (const ok of results) {
    const t = nextMonitorState(state, ok);
    actions.push(t.incident);
    state = { status: t.status, consecutiveFailures: t.consecutiveFailures };
  }
  return { state, actions };
}

describe("nextMonitorState", () => {
  it("ignores a single blip: no incident, back to up", () => {
    const { state, actions } = run({ status: "up", consecutiveFailures: 0 }, [false, true]);
    expect(actions).toEqual([null, null]);
    expect(state).toEqual({ status: "up", consecutiveFailures: 0 });
  });

  it("keeps the last status while confirming a first failure", () => {
    expect(nextMonitorState({ status: "up", consecutiveFailures: 0 }, false)).toEqual({ status: "up", consecutiveFailures: 1, incident: null });
    expect(nextMonitorState({ status: "pending", consecutiveFailures: 0 }, false)).toMatchObject({ status: "pending", incident: null });
  });

  it("opens an incident on the second failure, then resolves it on the first success", () => {
    const { state, actions } = run({ status: "up", consecutiveFailures: 0 }, [false, false, false, true]);
    expect(actions).toEqual([null, "open", null, "resolve"]);
    expect(state).toEqual({ status: "up", consecutiveFailures: 0 });
  });

  it("goes down from pending after two failures", () => {
    expect(run({ status: "pending", consecutiveFailures: 0 }, [false, false]).state.status).toBe("down");
  });

  it("does not resolve when a monitor first comes up", () => {
    expect(nextMonitorState({ status: "pending", consecutiveFailures: 0 }, true).incident).toBeNull();
  });
});

describe("formatDuration", () => {
  it("formats resolved and ongoing incidents", () => {
    expect(formatDuration("2026-10-12 18:00:00", "2026-10-12 18:00:20")).toBe("under a minute");
    expect(formatDuration("2026-10-12 18:00:00", "2026-10-12 18:12:00")).toBe("12 min");
    expect(formatDuration("2026-10-12 18:00:00", "2026-10-12 19:30:00")).toBe("1 h 30 min");
    expect(formatDuration("2026-10-12 18:00:00", null, Date.UTC(2026, 9, 12, 20, 0, 0))).toBe("2 h");
  });
});
