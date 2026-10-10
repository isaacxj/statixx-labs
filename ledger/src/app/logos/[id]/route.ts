import { getBusiness } from "@/server/db/queries";
import { getLogo } from "@/server/logos";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const business = /^\d+$/.test(id) ? await getBusiness(Number(id)) : null;
  const object = business?.logoKey ? await getLogo(business.logoKey) : null;
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      "cache-control": "private, max-age=300",
    },
  });
}
