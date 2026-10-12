"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseProjectInput } from "@/lib/projects";
import { insertProject, updateProject } from "@/server/db/queries";
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
