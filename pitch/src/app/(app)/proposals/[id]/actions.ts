"use server";

import { redirect } from "next/navigation";
import { parseCents, parseQtyMilli, parseRateBp } from "@/lib/pricing";
import {
  addLineItem,
  addSection,
  deleteLineItem,
  createLibrarySection,
  deleteSection,
  duplicateProposal,
  ensureShareToken,
  markProposalSent,
  saveProposalAsTemplate,
  insertLibrarySection,
  listLibrary,
  listLineItems,
  listSections,
  moveSection,
  updateLineItem,
  updateSection,
  updateProposalPricing,
  isProposalLocked,
  type LineItemPatch,
} from "@/server/db/queries";

const asId = (n: number) => (Number.isInteger(n) && n > 0 ? n : null);

/** Valid id of a proposal that can still be edited; accepted proposals are frozen. */
async function editableId(n: number) {
  const id = asId(n);
  return id && !(await isProposalLocked(id)) ? id : null;
}

export async function saveSectionAction(proposalId: number, id: number, title: string, bodyMd: string) {
  const pid = await editableId(proposalId);
  const sid = asId(id);
  if (!pid || !sid) return;
  await updateSection(sid, pid, { title: String(title), bodyMd: String(bodyMd) });
}

export async function addSectionAction(proposalId: number) {
  const pid = await editableId(proposalId);
  if (!pid) return { sections: [], addedId: null };
  const addedId = await addSection(pid);
  return { sections: await listSections(pid), addedId };
}

export async function moveSectionAction(proposalId: number, id: number, dir: -1 | 1) {
  const pid = await editableId(proposalId);
  const sid = asId(id);
  if (pid && sid && (dir === -1 || dir === 1)) await moveSection(sid, pid, dir);
  return { sections: asId(proposalId) ? await listSections(asId(proposalId)!) : [] };
}

export async function deleteSectionAction(proposalId: number, id: number) {
  const pid = await editableId(proposalId);
  const sid = asId(id);
  if (pid && sid) await deleteSection(sid, pid);
  return { sections: asId(proposalId) ? await listSections(asId(proposalId)!) : [] };
}

export async function addPricingSectionAction(proposalId: number) {
  const pid = await editableId(proposalId);
  if (!pid) return { sections: [], lines: [], addedId: null };
  const addedId = await addSection(pid, { title: "Pricing", bodyMd: "" }, "pricing");
  await addLineItem(addedId, pid);
  return { sections: await listSections(pid), lines: await listLineItems(pid), addedId };
}

export async function addLineItemAction(proposalId: number, sectionId: number) {
  const pid = await editableId(proposalId);
  const sid = asId(sectionId);
  if (pid && sid) await addLineItem(sid, pid);
  return { lines: asId(proposalId) ? await listLineItems(asId(proposalId)!) : [] };
}

export async function deleteLineItemAction(proposalId: number, id: number) {
  const pid = await editableId(proposalId);
  const iid = asId(id);
  if (pid && iid) await deleteLineItem(iid, pid);
  return { lines: asId(proposalId) ? await listLineItems(asId(proposalId)!) : [] };
}

/** Raw field strings in, validated patch out; a field that doesn't parse is skipped. */
export async function saveLineItemAction(
  proposalId: number,
  id: number,
  fields: { description?: string; qty?: string; unitPrice?: string; recurring?: string; optional?: boolean; selected?: boolean },
) {
  const pid = await editableId(proposalId);
  const iid = asId(id);
  if (pid && iid) {
    const patch: LineItemPatch = {};
    if (fields.description !== undefined) patch.description = String(fields.description).replace(/\s+/g, " ").trim().slice(0, 200);
    const qty = fields.qty === undefined ? null : parseQtyMilli(String(fields.qty));
    if (qty !== null) patch.qtyMilli = qty;
    const price = fields.unitPrice === undefined ? null : parseCents(String(fields.unitPrice));
    if (price !== null) patch.unitPriceCents = price;
    if (fields.recurring === "none" || fields.recurring === "monthly") patch.recurring = fields.recurring;
    if (typeof fields.optional === "boolean") patch.optional = fields.optional;
    if (typeof fields.selected === "boolean") patch.selected = fields.selected;
    await updateLineItem(iid, pid, patch);
  }
  return { lines: asId(proposalId) ? await listLineItems(asId(proposalId)!) : [] };
}

export async function savePricingTermsAction(proposalId: number, discount: string, tax: string) {
  const pid = await editableId(proposalId);
  const discountBp = parseRateBp(String(discount));
  const taxRateBp = parseRateBp(String(tax));
  if (pid && discountBp !== null && taxRateBp !== null) await updateProposalPricing(pid, { discountBp, taxRateBp });
  return { ok: pid !== null && discountBp !== null && taxRateBp !== null };
}

/** Saves the section's current text to the library as an independent copy. */
export async function saveToLibraryAction(proposalId: number, sectionId: number, category: string) {
  const pid = asId(proposalId);
  const sid = asId(sectionId);
  if (!pid || !sid) return { library: await listLibrary(), ok: false };
  const section = (await listSections(pid)).find((s) => s.id === sid && s.kind === "text");
  if (!section) return { library: await listLibrary(), ok: false };
  await createLibrarySection({ category: String(category), title: section.title, bodyMd: section.bodyMd });
  return { library: await listLibrary(), ok: true };
}

export async function insertFromLibraryAction(proposalId: number, libraryId: number) {
  const pid = await editableId(proposalId);
  const lid = asId(libraryId);
  const addedId = pid && lid ? await insertLibrarySection(pid, lid) : null;
  return { sections: asId(proposalId) ? await listSections(asId(proposalId)!) : [], addedId };
}

export async function duplicateProposalAction(formData: FormData) {
  const id = asId(Number(formData.get("proposalId")));
  const draft = id ? await duplicateProposal(id) : null;
  if (draft) redirect(`/proposals/${draft.id}`);
}

export async function saveTemplateAction(formData: FormData) {
  const id = asId(Number(formData.get("proposalId")));
  if (!id) return;
  const name = await saveProposalAsTemplate(id, String(formData.get("name") ?? ""));
  if (name) redirect(`/templates?saved=${encodeURIComponent(name)}`);
}

export async function shareLinkAction(proposalId: number) {
  const pid = asId(proposalId);
  return { token: pid ? await ensureShareToken(pid) : null };
}

export async function markSentAction(proposalId: number) {
  const pid = asId(proposalId);
  const token = pid ? await markProposalSent(pid) : null;
  return { token, status: token ? ("sent" as const) : null };
}
