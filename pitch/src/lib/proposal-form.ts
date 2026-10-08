import { PROPOSAL_STATUSES, type ProposalStatus } from "@/server/db/schema";

export type ProposalInput = { title: string; businessId: number; clientId: number };
export type ProposalErrors = Partial<Record<keyof ProposalInput, string>>;

type Source = { get(key: string): FormDataEntryValue | null };

const id = (s: Source, k: string) => {
  const n = Number(String(s.get(k) ?? "").trim());
  return Number.isInteger(n) && n > 0 ? n : 0;
};

export function parseProposalForm(s: Source): { value: ProposalInput } | { errors: ProposalErrors } {
  const errors: ProposalErrors = {};
  const title = String(s.get("title") ?? "").trim();
  const businessId = id(s, "businessId");
  const clientId = id(s, "clientId");
  if (!title) errors.title = "Enter a title.";
  if (!businessId) errors.businessId = "Choose a business.";
  if (!clientId) errors.clientId = "Choose a client.";
  if (Object.keys(errors).length) return { errors };
  return { value: { title, businessId, clientId } };
}

/** `STX-2026-001`: prefix, UTC year, and a zero-padded sequence. */
export function formatProposalNumber(prefix: string, seq: number, now = new Date()): string {
  return `${prefix}-${now.getUTCFullYear()}-${String(seq).padStart(3, "0")}`;
}

export function parseStatusFilter(value: string | undefined): ProposalStatus | null {
  return PROPOSAL_STATUSES.find((s) => s === value) ?? null;
}
