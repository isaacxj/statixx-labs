export const CADENCES = ["monthly", "quarterly"] as const;
export type Cadence = (typeof CADENCES)[number];

export type Schedule = {
  cadence: Cadence;
  anchorDay: number;
  startsOn: string;
  endsOn: string | null;
};

const STEP: Record<Cadence, number> = { monthly: 1, quarterly: 3 };

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** The anchor day in a month, pulled back to the last day when the month is shorter (31st becomes Feb 28). */
function runOn(year: number, month: number, anchorDay: number): string {
  const day = Math.min(anchorDay, daysInMonth(year, month));
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

/**
 * Run dates on or after `onOrAfter` (and on or after the start date), in order, up to `count`.
 * The series is anchored to the start month, so quarterly runs stay three months apart.
 */
export function runDates(s: Schedule, count: number, onOrAfter: string): string[] {
  const from = onOrAfter > s.startsOn ? onOrAfter : s.startsOn;
  const startYear = Number(s.startsOn.slice(0, 4));
  const startMonth = Number(s.startsOn.slice(5, 7)) - 1;
  const out: string[] = [];
  for (let k = 0; out.length < count && k < 1200; k++) {
    const months = startMonth + k * STEP[s.cadence];
    const date = runOn(startYear + Math.floor(months / 12), months % 12, s.anchorDay);
    if (s.endsOn && date > s.endsOn) break;
    if (date >= from) out.push(date);
  }
  return out;
}

export function cadenceLabel(c: Cadence): string {
  return c === "monthly" ? "Monthly" : "Quarterly";
}
