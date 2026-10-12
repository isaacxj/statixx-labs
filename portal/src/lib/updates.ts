type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const UPDATE_MAX_LENGTH = 10000;

export function parseUpdateInput(form: FormData): Result<string> {
  const body = String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (!body) return { ok: false, error: "Write the update before posting." };
  if (body.length > UPDATE_MAX_LENGTH) return { ok: false, error: `Updates can be up to ${UPDATE_MAX_LENGTH.toLocaleString("en-US")} characters.` };
  return { ok: true, value: body };
}

/** "2026-10-09 15:10:00" (UTC, as stored) to "Oct 9, 2026, 10:10 AM" in the team's zone. */
export function formatPostedAt(utc: string): string {
  const date = new Date(`${utc.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return utc;
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
