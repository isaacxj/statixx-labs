import { centsToText, qtyToText } from "@/lib/invoice-math";
import { formatRate } from "@/lib/money";
import { listBusinesses, listClients } from "@/server/db/queries";
import type { EditorBusiness, EditorClient } from "./invoice-editor";

/** Rates are edited as plain percent text, so 1300 basis points becomes "13". */
export const rateText = (bp: number) => formatRate(bp).replace("%", "");
export { centsToText, qtyToText };

export async function loadEditorOptions(): Promise<{ businesses: EditorBusiness[]; clients: EditorClient[] }> {
  const [businesses, clients] = await Promise.all([listBusinesses(), listClients()]);
  return {
    businesses: businesses.map((b) => ({
      id: b.id,
      name: b.name,
      legalName: b.legalName,
      address: b.address,
      accent: b.accent,
      currency: b.currency,
      hasLogo: !!b.logoKey,
      taxRate: rateText(b.taxRateBp),
      termsDays: b.termsDays,
      numberPrefix: b.numberPrefix,
      nextNumber: b.nextNumber,
    })),
    clients: clients.map((c) => ({ id: c.id, name: c.name, company: c.company, email: c.email, address: c.address })),
  };
}
