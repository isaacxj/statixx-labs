"use server";

import { addSection, deleteSection, listSections, moveSection, updateSection } from "@/server/db/queries";

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
