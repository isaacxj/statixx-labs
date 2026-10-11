/** Elements where typing a letter must never trigger a shortcut. */
export function isTypingTarget(el: { tagName?: string; isContentEditable?: boolean } | null): boolean {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = (el.tagName ?? "").toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export type KeyLike = { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean };

export function isPaletteKey(e: KeyLike): boolean {
  return e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && !e.altKey;
}

/** Bare `t` toggles the timer. */
export function isTimerKey(e: KeyLike): boolean {
  return e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
}

export type ToggleAction = { type: "stop" } | { type: "start"; projectId: number } | { type: "pick" };

/** Stop a running timer; otherwise restart the last-used project when it still exists, or ask which one. */
export function timerToggleAction(running: boolean, lastProjectId: number | null, projectIds: number[]): ToggleAction {
  if (running) return { type: "stop" };
  if (lastProjectId !== null && projectIds.includes(lastProjectId)) return { type: "start", projectId: lastProjectId };
  return { type: "pick" };
}
