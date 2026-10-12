"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseMilestoneInput, todayInChicago } from "@/lib/milestones";
import { parseProjectInput } from "@/lib/projects";
import { parseAttachments, parseFileUpload, safeFileName } from "@/lib/files";
import { parseUpdateInput } from "@/lib/updates";
import { env } from "cloudflare:workers";
import { deleteFile, deleteMilestone, deleteUpdate, insertFile, insertMilestone, insertProject, insertUpdate, setMilestoneDone, updateProject } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";

async function requireTeam() {
  const user = await getCurrentUser();
  if (user.kind !== "team") throw new Error("Team only");
  return user;
}

const back = (path: string, key: "error" | "saved", message: string) => redirect(`${path}?${key}=${encodeURIComponent(message)}`);

export async function createProjectAction(clientId: number, form: FormData) {
  await requireTeam();
  const path = `/clients/${clientId}`;
  const parsed = parseProjectInput(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  const id = await insertProject(clientId, parsed.value);
  revalidatePath(path);
  return back(`/projects/${id}`, "saved", "Project created");
}

export async function updateProjectAction(projectId: number, form: FormData) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  const parsed = parseProjectInput(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  await updateProject(projectId, parsed.value);
  revalidatePath("/");
  revalidatePath(path);
  return back(path, "saved", "Project updated");
}

export async function addMilestoneAction(projectId: number, form: FormData) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  const parsed = parseMilestoneInput(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  await insertMilestone(projectId, parsed.value);
  revalidatePath(path);
  return back(path, "saved", "Milestone added");
}

export async function toggleMilestoneAction(projectId: number, milestoneId: number, done: boolean) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  await setMilestoneDone(projectId, milestoneId, done ? todayInChicago() : null);
  revalidatePath(path);
  return back(path, "saved", done ? "Milestone completed" : "Milestone reopened");
}

export async function deleteMilestoneAction(projectId: number, milestoneId: number) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  await deleteMilestone(projectId, milestoneId);
  revalidatePath(path);
  return back(path, "saved", "Milestone removed");
}

export async function postUpdateAction(projectId: number, form: FormData) {
  const user = await requireTeam();
  const path = `/projects/${projectId}`;
  const parsed = parseUpdateInput(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  const attachments = parseAttachments(form);
  if (!attachments.ok) return back(path, "error", attachments.error);
  const updateId = await insertUpdate(projectId, user.email, parsed.value);
  for (const file of attachments.value) {
    const contentType = file.type || "application/octet-stream";
    const r2Key = `projects/${projectId}/${crypto.randomUUID()}`;
    await env.FILES.put(r2Key, await file.arrayBuffer(), { httpMetadata: { contentType } });
    await insertFile({ projectId, updateId, r2Key, name: safeFileName(file.name), size: file.size, contentType, uploadedBy: user.email });
  }
  revalidatePath(path);
  return back(path, "saved", attachments.value.length ? `Update posted with ${attachments.value.length} attachment${attachments.value.length === 1 ? "" : "s"}` : "Update posted");
}

export async function deleteUpdateAction(projectId: number, updateId: number) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  const keys = await deleteUpdate(projectId, updateId);
  await Promise.all(keys.map((k) => env.FILES.delete(k)));
  revalidatePath(path);
  return back(path, "saved", "Update removed");
}

export async function uploadFileAction(projectId: number, form: FormData) {
  const user = await requireTeam();
  const path = `/projects/${projectId}`;
  const parsed = parseFileUpload(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  const file = parsed.value;
  const r2Key = `projects/${projectId}/${crypto.randomUUID()}`;
  await env.FILES.put(r2Key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
  await insertFile({ projectId, r2Key, name: safeFileName(file.name), size: file.size, contentType: file.type || "application/octet-stream", uploadedBy: user.email });
  revalidatePath(path);
  return back(path, "saved", "File uploaded");
}

export async function deleteFileAction(projectId: number, fileId: number) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  const key = await deleteFile(projectId, fileId);
  if (key) await env.FILES.delete(key);
  revalidatePath(path);
  return back(path, "saved", "File removed");
}
