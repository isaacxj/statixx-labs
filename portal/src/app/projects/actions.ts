"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseMilestoneInput, todayInChicago } from "@/lib/milestones";
import { parseProjectInput } from "@/lib/projects";
import { parseAttachments, parseFileUpload, safeFileName } from "@/lib/files";
import { parseApprovalDecision, parseApprovalInput } from "@/lib/approvals";
import { parseUpdateInput } from "@/lib/updates";
import { parseRequestInput, parseRequestStatus } from "@/lib/requests";
import { env } from "cloudflare:workers";
import { decideApproval, deleteApproval, deleteFile, deleteMilestone, deleteUpdate, insertApproval, insertFile, insertMilestone, insertProject, insertRequest, insertUpdate, setMilestoneDone, setRequestStatus, updateProject } from "@/server/db/queries";
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

export async function requestApprovalAction(projectId: number, form: FormData) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  const parsed = parseApprovalInput(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  await insertApproval(projectId, parsed.value);
  revalidatePath(path);
  return back(path, "saved", "Approval requested");
}

export async function deleteApprovalAction(projectId: number, approvalId: number) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  await deleteApproval(projectId, approvalId);
  revalidatePath(path);
  return back(path, "saved", "Approval removed");
}

export async function decideApprovalAction(projectId: number, approvalId: number, form: FormData) {
  const user = await getCurrentUser();
  const path = `/projects/${projectId}`;
  const parsed = parseApprovalDecision(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  const done = await decideApproval(user, projectId, approvalId, parsed.value);
  if (!done) return back(path, "error", "This approval can't be decided by you, or it was already decided.");
  revalidatePath(path);
  return back(path, "saved", parsed.value.status === "approved" ? "Approved" : "Changes requested");
}

export async function submitRequestAction(projectId: number, form: FormData) {
  const user = await getCurrentUser();
  const path = `/projects/${projectId}`;
  const parsed = parseRequestInput(form);
  if (!parsed.ok) return back(path, "error", parsed.error);
  const attachments = parseAttachments(form);
  if (!attachments.ok) return back(path, "error", attachments.error);
  const requestId = await insertRequest(user, projectId, parsed.value);
  if (requestId === null) return back(path, "error", "You can't send a request on this project.");
  for (const file of attachments.value) {
    const contentType = file.type || "application/octet-stream";
    const r2Key = `projects/${projectId}/${crypto.randomUUID()}`;
    await env.FILES.put(r2Key, await file.arrayBuffer(), { httpMetadata: { contentType } });
    await insertFile({ projectId, requestId, r2Key, name: safeFileName(file.name), size: file.size, contentType, uploadedBy: user.email });
  }
  revalidatePath(path);
  return back(path, "saved", "Request sent");
}

export async function setRequestStatusAction(projectId: number, requestId: number, form: FormData) {
  await requireTeam();
  const path = `/projects/${projectId}`;
  const parsed = parseRequestStatus(form.get("status"));
  if (!parsed.ok) return back(path, "error", parsed.error);
  await setRequestStatus(projectId, requestId, parsed.value);
  revalidatePath(path);
  return back(path, "saved", "Request updated");
}
