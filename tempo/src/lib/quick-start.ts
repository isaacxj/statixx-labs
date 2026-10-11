export type QuickStartEntry = { projectId: number; projectName: string; clientName: string; color: string; description: string };
export type QuickStartItem = QuickStartEntry;

/** The most recently used project/description pairs, newest first, so a timer restarts in one tap. */
export function recentQuickStarts(entriesNewestFirst: QuickStartEntry[], limit = 4): QuickStartItem[] {
  const seen = new Set<string>();
  const out: QuickStartItem[] = [];
  for (const e of entriesNewestFirst) {
    const key = `${e.projectId}|${e.description}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length === limit) break;
  }
  return out;
}
