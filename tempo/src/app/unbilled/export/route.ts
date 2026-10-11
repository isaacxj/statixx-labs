import { slugify, unbilledCsv } from "@/lib/unbilled"
import { listUnbilledEntries } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const clientId = Number(new URL(request.url).searchParams.get("client"));
  if (!Number.isInteger(clientId) || clientId <= 0) return new Response("Missing client", { status: 400 });
  const entries = await listUnbilledEntries(clientId);
  if (entries.length === 0) return new Response("Nothing unbilled for this client", { status: 404 });
  return new Response(unbilledCsv(entries), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tempo-unbilled-${slugify(entries[0].clientName)}.csv"`,
    },
  });
}
