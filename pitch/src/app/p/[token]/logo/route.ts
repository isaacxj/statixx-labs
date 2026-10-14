import { isShareToken } from "@/lib/share";
import { getLogoKeyByToken } from "@/server/db/queries";
import { getLogo } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const key = isShareToken(token) ? await getLogoKeyByToken(token) : null;
  const object = key ? await getLogo(key) : null;
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
