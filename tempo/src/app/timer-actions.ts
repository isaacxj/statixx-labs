"use server";

import { revalidatePath } from "next/cache";
import { startTimer, stopTimer } from "@/server/db/queries";
import { getCurrentUser } from "@/server/user";

export async function startTimerAction(projectId: number, description: string) {
  if (!Number.isInteger(projectId) || projectId <= 0) return;
  const user = await getCurrentUser();
  await startTimer(user.email, projectId, description.trim().slice(0, 200));
  revalidatePath("/", "layout");
}

export async function stopTimerAction() {
  const user = await getCurrentUser();
  await stopTimer(user.email);
  revalidatePath("/", "layout");
}
