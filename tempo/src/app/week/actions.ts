"use server";

import { revalidatePath } from "next/cache";
import { parseHoursToMinutes } from "@/lib/project-form";
import { setCellMinutes } from "@/server/db/queries";
import { getCurrentUser } from "@/server/user";

/** Sets one timesheet cell. Empty text clears it. Returns an error message or null. */
export async function setCellAction(projectId: number, day: string, text: string): Promise<string | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isInteger(projectId)) return "Invalid cell.";
  const minutes = text.trim() === "" ? 0 : parseHoursToMinutes(text);
  if (minutes === null) return "Enter hours like 1:30 or 1.5.";
  const user = await getCurrentUser();
  const error = await setCellMinutes(user.email, projectId, day, minutes);
  if (!error) revalidatePath("/", "layout");
  return error;
}
