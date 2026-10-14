"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { clientIp, cleanReason, cleanSignature } from "@/lib/respond";
import { isShareToken } from "@/lib/share";
import { acceptProposal, declineProposal } from "@/server/db/queries";

export type RespondState = { error: string | null };

const CLOSED = "This proposal has already been answered.";

export async function acceptAction(token: string, name: string, agreed: boolean, selectedIds: number[]): Promise<RespondState> {
  if (!isShareToken(token)) return { error: "This link isn't valid." };
  const signature = cleanSignature(String(name));
  if (!signature) return { error: "Type your full name to accept." };
  if (agreed !== true) return { error: "Tick the box to confirm you agree." };
  const r = await acceptProposal(token, { name: signature, ip: clientIp(await headers()), selectedIds });
  if (!r.ok) return { error: r.reason === "closed" ? CLOSED : "This link isn't valid." };
  revalidatePath(`/p/${token}`);
  return { error: null };
}

export async function declineAction(token: string, reason: string): Promise<RespondState> {
  if (!isShareToken(token)) return { error: "This link isn't valid." };
  const r = await declineProposal(token, cleanReason(String(reason)));
  if (!r.ok) return { error: r.reason === "closed" ? CLOSED : "This link isn't valid." };
  revalidatePath(`/p/${token}`);
  return { error: null };
}
