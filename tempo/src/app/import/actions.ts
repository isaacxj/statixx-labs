"use server";

import { revalidatePath } from "next/cache";
import { sanitizeRows } from "@/lib/import";
import { importEntries, type ImportResult } from "@/server/db/queries";
import { getCurrentUser } from "@/server/user";

export type ImportState = { error?: string; result?: ImportResult } | null;

/** Imports the previewed rows, with each client/project group mapped to a project id or "new". */
export async function runImport(payload: { rows: unknown; mapping: Record<string, number | "new"> }): Promise<ImportState> {
  const rows = sanitizeRows(payload.rows);
  if (rows.length === 0) return { error: "There is nothing to import." };
  const user = await getCurrentUser();
  try {
    const result = await importEntries(user.email, rows, payload.mapping ?? {});
    revalidatePath("/", "layout");
    return { result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The import failed." };
  }
}
