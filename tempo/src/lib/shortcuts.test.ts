import { describe, expect, it } from "vitest";
import { isPaletteKey, isTimerKey, isTypingTarget, timerToggleAction } from "./shortcuts";

const key = (k: string, extra: Partial<Parameters<typeof isTimerKey>[0]> = {}) => ({ key: k, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...extra });

describe("shortcuts", () => {
  it("ignores typing in fields", () => {
    expect(isTypingTarget({ tagName: "input" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
  });
  it("matches palette and timer keys", () => {
    expect(isPaletteKey(key("k", { metaKey: true }))).toBe(true);
    expect(isPaletteKey(key("k", { ctrlKey: true }))).toBe(true);
    expect(isPaletteKey(key("k"))).toBe(false);
    expect(isTimerKey(key("t"))).toBe(true);
    expect(isTimerKey(key("t", { metaKey: true }))).toBe(false);
  });
  it("stops, restarts the last project, or asks", () => {
    expect(timerToggleAction(true, 2, [2])).toEqual({ type: "stop" });
    expect(timerToggleAction(false, 2, [1, 2])).toEqual({ type: "start", projectId: 2 });
    expect(timerToggleAction(false, 9, [1, 2])).toEqual({ type: "pick" });
    expect(timerToggleAction(false, null, [1])).toEqual({ type: "pick" });
  });
});
