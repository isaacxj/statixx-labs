import { BILLING_TYPES, type BillingType } from "@/server/db/schema";

export type ProjectInput = {
  clientId: number;
  name: string;
  billing: BillingType;
  rateCents: number;
  budgetMinutes: number | null;
  fixedFeeCents: number | null;
  color: string;
};

export type ProjectParse = { ok: true; data: ProjectInput } | { ok: false; errors: Record<string, string> };

/** "125.50" -> 12550. Returns null for empty or invalid input. */
export function parseCents(value: string): number | null {
  const v = value.trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v) * 100);
}

/** "12", "12.5", or "12:30" hours -> whole minutes. Returns null for empty or invalid input. */
export function parseHoursToMinutes(value: string): number | null {
  const v = value.trim();
  const clock = /^(\d+):([0-5]\d)$/.exec(v);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  if (!/^\d+(\.\d+)?$/.test(v)) return null;
  return Math.round(Number(v) * 60);
}

export function parseProjectForm(form: FormData): ProjectParse {
  const errors: Record<string, string> = {};
  const get = (k: string) => String(form.get(k) ?? "").trim();

  const clientId = Number(get("clientId"));
  if (!Number.isInteger(clientId) || clientId <= 0) errors.clientId = "Pick a client";

  const name = get("name");
  if (!name) errors.name = "Name is required";

  const billing = get("billing") as BillingType;
  if (!BILLING_TYPES.includes(billing)) errors.billing = "Pick a billing type";

  let rateCents = 0;
  if (billing === "hourly") {
    const r = parseCents(get("rate"));
    if (r === null) errors.rate = "Enter an hourly rate, like 90 or 90.50";
    else rateCents = r;
  }

  let fixedFeeCents: number | null = null;
  if (billing === "fixed") {
    const f = parseCents(get("fixedFee"));
    if (f === null) errors.fixedFee = "Enter the fixed fee, like 6000";
    else fixedFeeCents = f;
  }

  let budgetMinutes: number | null = null;
  if (get("budget")) {
    budgetMinutes = parseHoursToMinutes(get("budget"));
    if (budgetMinutes === null || budgetMinutes <= 0) errors.budget = "Enter hours, like 40 or 12:30";
  }

  const color = get("color");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) errors.color = "Pick a color";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { clientId, name, billing, rateCents, budgetMinutes, fixedFeeCents, color: color.toUpperCase() } };
}
