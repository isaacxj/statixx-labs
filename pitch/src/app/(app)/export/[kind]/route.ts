import { LINE_HEADER, PROPOSAL_HEADER, lineRows, proposalRows, toCsv } from "@/lib/csv";
import { listExportData } from "@/server/db/queries";

export const dynamic = "force-dynamic";

const FILES = { proposals: "pitch-proposals.csv", "line-items": "pitch-line-items.csv" } as const;

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const kind = (await params).kind.replace(/\.csv$/, "");
  if (kind !== "proposals" && kind !== "line-items") return new Response("Not found", { status: 404 });
  const { proposals, lines } = await listExportData();
  const body = kind === "proposals" ? toCsv(PROPOSAL_HEADER, proposalRows(proposals)) : toCsv(LINE_HEADER, lineRows(proposals, lines));
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${FILES[kind]}"`,
      "cache-control": "no-store",
    },
  });
}
