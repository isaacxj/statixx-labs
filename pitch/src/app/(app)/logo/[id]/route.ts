import { getBusiness } from "@/server/db/queries";
import { getLogo } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const business = await getBusiness(Number((await params).id));
  if (!business?.logoKey) return new Response("Not found", { status: 404 });
  const object = await getLogo(business.logoKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
