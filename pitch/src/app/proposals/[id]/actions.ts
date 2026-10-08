"use server";

import { parseCents, parseQtyMilli, parseRateBp } from "@/lib/pricing";
import {
  addLineItem,
  addSection,
  deleteLineItem,
  deleteSection,
  listLineItems,
  listSections,
  moveSection,
  updateLineItem,
  updateSection,
  updateProposalPricing,
  type LineItemPatch,
} from "@/server/db/queries";

const asId = (n: number) => (Number.isInteger(n) && n > 0 ? n : null);

export async function saveSectionAction(proposalId: number, id: number, title: string, bodyMd: string) {
  const pid = asId(proposalId);
  const sid = asId(id);
  if (!pid || !sid) return;
  await updateSection(sid, pid, { title: String(title), bodyMd: String(bodyMd) });
}

export async function addSectionAction(proposalId: number) {
  const pid = asId(proposalId);
  if (!pid) return { sections: [], addedId: null };
  const addedId = await addSection(pid);
  return { sections: await listSections(pid), addedId };
}

export async function moveSectionAction(proposalId: number, id: number, dir: -1 | 1) {
  const pid = asId(proposalId);
  const sid = asId(id);
  if (pid && sid && (dir === -1 || dir === 1)) await moveSection(sid, pid, dir);
  return { sections: pid ? await listSections(pid) : [] };
}

export async function deleteSectionAction(proposalId: number, id: number) {
  const pid = asId(proposalId);
  const sid = asId(id);
  if (pid && sid) await deleteSection(sid, pid);
  return { sections: pid ? await listSections(pid) : [] };
}

export async function addPricingSectionAction(proposalId: number) {
  const pid = asId(proposalId);
  if (!pid) return { sections: [], lines: [], addedId: null };
  const addedId = await addSection(pid, { title: "Pricing", bodyMd: "" }, "pricing");
  await addLineItem(addedId, pid);
  return { sections: await listSections(pid), lines: await listLineItems(pid), addedId };
}

export async function addLineItemAction(proposalId: number, sectionId: number) {
  const pid = asId(proposalId);
  const sid = asId(sectionId);
  if (pid && sid) await addLineItem(sid, pid);
  return { lines: pid ? await listLineItems(pid) : [] };
}

export async function deleteLineItemAction(proposalId: number, id: number) {
  const pid = asId(proposalId);
  const iid = asId(id);
  if (pid && iid) await deleteLineItem(iid, pid);
  return { lines: pid ? await listLineItems(pid) : [] };
}

/** Raw field strings in, validated patch out; a field that doesn't parse is skipped. */
export async function saveLineItemAction(
  proposalId: number,
  id: number,
  fields: { description?: string; qty?: string; unitPrice?: string; recurring?: string; optional?: boolean; selected?: boolean },
) {
  const pid = asId(proposalId);
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
  return { lines: pid ? await listLineItems(pid) : [] };
}

export async function savePricingTermsAction(proposalId: number, discount: string, tax: string) {
  const pid = asId(proposalId);
  const discountBp = parseRateBp(String(discount));
  const taxRateBp = parseRateBp(String(tax));
  if (pid && discountBp !== null && taxRateBp !== null) await updateProposalPricing(pid, { discountBp, taxRateBp });
  return { ok: pid !== null && discountBp !== null && taxRateBp !== null };
}
