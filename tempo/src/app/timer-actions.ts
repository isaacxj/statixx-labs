"use server";

import { revalidatePath } from "next/cache";
import { parseKeepMinutes } from "@/lib/idle";
import { minutesBetween } from "@/lib/timer";
import { getRunningEntry, resolveIdleTimer, startTimer, stopTimer } from "@/server/db/queries";
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

/** Keep-or-trim answer for a timer past the idle limit: "trim" saves `keep` minutes, "discard" deletes the entry. */
export async function resolveIdleTimerAction(entryId: number, choice: "trim" | "discard", keep: string) {
  const user = await getCurrentUser();
  if (choice === "discard") {
    await resolveIdleTimer(user.email, entryId, null);
  } else {
    const running = await getRunningEntry(user.email);
    if (!running) return;
    const minutes = parseKeepMinutes(keep, minutesBetween(running.startedAt, new Date().toISOString()));
    if (minutes === null) return;
    await resolveIdleTimer(user.email, entryId, minutes);
  }
  revalidatePath("/", "layout");
}
