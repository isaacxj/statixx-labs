import { centsToDecimal, toCsv } from "@/lib/csv";
import { getReportPayments } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getReportPayments();
  const body = toCsv(
    ["Paid on", "Invoice", "Business", "Client", "Currency", "Amount", "Method", "Reference"],
    rows.map((p) => [p.paidOn, p.number, p.businessName, p.clientName, p.currency, centsToDecimal(p.amountCents), p.method, p.reference]),
  );
  return new Response(body, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="ledger-payments.csv"', "cache-control": "no-store" },
  });
}
