export type BusinessInput = {
  name: string;
  legalName: string | null;
  address: string | null;
  accent: string;
  currency: "USD" | "CAD";
  taxRateBp: number;
  defaultTermsMd: string;
  numberPrefix: string;
};

export type BusinessErrors = Partial<Record<keyof BusinessInput, string>>;

type Source = { get(key: string): FormDataEntryValue | null };

const text = (s: Source, k: string) => String(s.get(k) ?? "").trim();

/** Percent string like "8.25" to basis points (825). Returns null when invalid. */
export function percentToBp(value: string): number | null {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) return null;
  const bp = Math.round(Number(value) * 100);
  return bp <= 10000 ? bp : null;
}

export function bpToPercent(bp: number): string {
  return (bp / 100).toFixed(2).replace(/\.?0+$/, "");
}

export function parseBusinessForm(s: Source): { value: BusinessInput } | { errors: BusinessErrors } {
  const errors: BusinessErrors = {};
  const name = text(s, "name");
  const accent = text(s, "accent");
  const currency = text(s, "currency");
  const numberPrefix = text(s, "numberPrefix").toUpperCase();
  const taxRateBp = percentToBp(text(s, "taxRate") || "0");

  if (!name) errors.name = "Enter a name.";
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) errors.accent = "Use a hex color like #8B5CF6.";
  if (currency !== "USD" && currency !== "CAD") errors.currency = "Choose USD or CAD.";
  if (!/^[A-Z0-9]{2,6}$/.test(numberPrefix)) errors.numberPrefix = "Use 2 to 6 letters or numbers.";
  if (taxRateBp === null) errors.taxRateBp = "Enter a rate from 0 to 100.";
  if (Object.keys(errors).length || taxRateBp === null) return { errors };

  return {
    value: {
      name,
      legalName: text(s, "legalName") || null,
      address: text(s, "address") || null,
      accent: accent.toUpperCase(),
      currency: currency as "USD" | "CAD",
      taxRateBp,
      defaultTermsMd: text(s, "defaultTermsMd"),
      numberPrefix,
    },
  };
}

export function formatProposalNumber(prefix: string, year: number, next: number): string {
  return `${prefix}-${year}-${String(next).padStart(3, "0")}`;
}
