"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseMilestoneInput, todayInChicago } from "@/lib/milestones";
import { parseProjectInput } from "@/lib/projects";
import { deleteMilestone, insertMilestone, insertProject, setMilestoneDone, updateProject } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";

async function requireTeam() {
  const user = await getCurrentUser();
  if (user.kind !== "team") throw new Error("Team only");
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
