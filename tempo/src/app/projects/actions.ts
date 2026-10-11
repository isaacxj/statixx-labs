"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseProjectForm } from "@/lib/project-form";
import { createProject, setProjectStatus, updateProject } from "@/server/db/queries";

export type FormState = { errors: Record<string, string> } | null;

export async function saveProject(id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const parsed = parseProjectForm(form);
  if (!parsed.ok) return { errors: parsed.errors };
  if (id === null) await createProject(parsed.data);
  else await updateProject(id, parsed.data);
  revalidatePath("/projects");
  revalidatePath("/clients");
  redirect("/projects");
}

export async function archiveProject(id: number, archived: boolean) {
  await setProjectStatus(id, archived ? "archived" : "active");
  revalidatePath("/projects");
  revalidatePath("/clients");
}
