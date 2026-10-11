import { entriesCsv } from "@/lib/reports";
import { loadReport } from "../range";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const { range, entries } = await loadReport(q.get("from") ?? undefined, q.get("to") ?? undefined);
  return new Response(entriesCsv(entries), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tempo-hours-${range.from}-to-${range.to}.csv"`,
    },
  });
}
