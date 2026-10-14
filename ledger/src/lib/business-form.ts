import { CURRENCIES, type Currency } from "@/server/db/schema";

export type BusinessInput = {
  name: string;
  legalName: string;
  address: string;
  accent: string;
  currency: Currency;
  taxRateBp: number;
  termsDays: number;
  paymentInstructionsMd: string;
  numberPrefix: string;
};

export type BusinessErrors = Partial<Record<keyof BusinessInput, string>>;

/** "13" or "8.75" percent to basis points, or null when it is not a rate from 0 to 100. */
export function percentToBp(text: string): number | null {
  const t = text.trim().replace(/%$/, "");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return null;
  const bp = Math.round(Number(t) * 100);
  return bp <= 10000 ? bp : null;
}

const str = (d: FormData, k: string) => String(d.get(k) ?? "").trim();

export function parseBusinessForm(
  data: FormData,
): { ok: true; value: BusinessInput } | { ok: false; errors: BusinessErrors } {
  const errors: BusinessErrors = {};
  const name = str(data, "name");
  if (!name) errors.name = "Enter a name.";

  const numberPrefix = str(data, "numberPrefix").toUpperCase();
  if (!/^[A-Z0-9]{1,6}$/.test(numberPrefix)) errors.numberPrefix = "Use 1 to 6 letters or numbers.";

  const currency = str(data, "currency") as Currency;
  if (!CURRENCIES.includes(currency)) errors.currency = "Pick a currency.";

  const accent = str(data, "accent").toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(accent)) errors.accent = "Pick a color.";

  const taxRateBp = percentToBp(str(data, "taxRate") || "0");
  if (taxRateBp === null) errors.taxRateBp = "Enter a rate from 0 to 100, like 13 or 8.75.";

  const termsText = str(data, "termsDays");
  const termsDays = Number(termsText);
  if (!/^\d{1,3}$/.test(termsText) || termsDays > 365) errors.termsDays = "Enter whole days from 0 to 365.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      legalName: str(data, "legalName"),
      address: str(data, "address"),
      accent,
      currency,
      taxRateBp: taxRateBp as number,
      termsDays,
      paymentInstructionsMd: str(data, "paymentInstructions"),
      numberPrefix,
    },
  };
}

export const MAX_LOGO_BYTES = 1_000_000;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;

export function checkLogo(file: File): string | null {
  if (!(LOGO_TYPES as readonly string[]).includes(file.type)) return "Use a PNG, JPEG, WebP, or SVG image.";
  if (file.size > MAX_LOGO_BYTES) return "Keep the logo under 1 MB.";
  return null;
}
