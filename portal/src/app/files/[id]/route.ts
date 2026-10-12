import { env } from "cloudflare:workers";
import { getFileForUser } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";

export const dynamic = "force-dynamic";

/** Streams a file from R2 after checking the signed-in user may see its project; 404 for everything else. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId)) return new Response("Not found", { status: 404 });
  const file = await getFileForUser(await getCurrentUser(), fileId);
  if (!file) return new Response("Not found", { status: 404 });
  const object = await env.FILES.get(file.r2Key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.size),
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
}
