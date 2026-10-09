"use server";

import { redirect } from "next/navigation";
import { parseProposalForm, type ProposalErrors } from "@/lib/proposal-form";
import { createProposal } from "@/server/db/queries";

export type ProposalFormState = { errors: ProposalErrors } | null;

export async function saveProposal(_prev: ProposalFormState, formData: FormData): Promise<ProposalFormState> {
  const parsed = parseProposalForm(formData);
  if ("errors" in parsed) return { errors: parsed.errors };
  const number = await createProposal(parsed.value);
  redirect(`/proposals?created=${encodeURIComponent(number)}`);
}
