import { parseUtc } from "@/lib/uptime";

export type WindowLike = { monitorId: number; startsAt: string; endsAt: string };
export type WindowState = "active" | "upcoming" | "past";

export function windowState(w: Pick<WindowLike, "startsAt" | "endsAt">, now: number): WindowState {
  if (now >= parseUtc(w.endsAt)) return "past";
  return now >= parseUtc(w.startsAt) ? "active" : "upcoming";
}

/** Ids of the monitors that are inside a maintenance window at `now`. */
export function monitorsInMaintenance(windows: WindowLike[], now: number): Set<number> {
  return new Set(windows.filter((w) => windowState(w, now) === "active").map((w) => w.monitorId));
}

const TZ = "America/Chicago";

/** Offset of Central time from UTC at the given instant, in ms (negative for Central). */
function zoneOffsetMs(utcMs: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Turns a `datetime-local` value (Central wall time) into a UTC `YYYY-MM-DD HH:MM:SS` string, or null when invalid. */
export function centralToUtc(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (Number.isNaN(wall)) return null;
  let utc = wall - zoneOffsetMs(wall);
  utc = wall - zoneOffsetMs(utc);
  return new Date(utc).toISOString().slice(0, 19).replace("T", " ");
}

export type WindowInput = { monitorId: number; startsAt: string; endsAt: string; note: string };
export type WindowErrors = Partial<Record<keyof WindowInput, string>>;
export type WindowFormResult = { ok: true; value: WindowInput } | { ok: false; errors: WindowErrors };

export function parseWindowForm(form: FormData, now = Date.now()): WindowFormResult {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const errors: WindowErrors = {};
  const monitorId = Number(text("monitorId"));
  if (!Number.isInteger(monitorId) || monitorId <= 0) errors.monitorId = "Pick a monitor.";
  const startsAt = centralToUtc(text("startsAt"));
  const endsAt = centralToUtc(text("endsAt"));
  if (!startsAt) errors.startsAt = "Enter a start date and time.";
  if (!endsAt) errors.endsAt = "Enter an end date and time.";
  if (startsAt && endsAt) {
    if (parseUtc(endsAt) <= parseUtc(startsAt)) errors.endsAt = "The end must be after the start.";
    else if (parseUtc(endsAt) <= now) errors.endsAt = "The window has already ended.";
  }
  const note = text("note");
  if (note.length > 200) errors.note = "Keep the note under 200 characters.";
  if (Object.keys(errors).length > 0 || !startsAt || !endsAt) return { ok: false, errors };
  return { ok: true, value: { monitorId, startsAt, endsAt, note } };
}
