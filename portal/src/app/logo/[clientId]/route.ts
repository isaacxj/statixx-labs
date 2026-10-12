import { env } from "cloudflare:workers";
import { getClientBrandingForUser } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";

export const dynamic = "force-dynamic";

/** Streams a client's logo from R2 for the team and that client's own users; 404 for everyone else. */
export async function GET(_req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const clientId = Number((await params).clientId);
  if (!Number.isInteger(clientId)) return new Response("Not found", { status: 404 });
  const client = await getClientBrandingForUser(await getCurrentUser(), clientId);
  if (!client?.logoKey) return new Response("Not found", { status: 404 });
  const object = await env.FILES.get(client.logoKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "image/png",
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-cache",
    },
  });
}
