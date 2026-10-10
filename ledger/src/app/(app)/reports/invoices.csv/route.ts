import { centsToDecimal, toCsv } from "@/lib/csv";
import { getReportInvoices } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getReportInvoices();
  const body = toCsv(
    ["Number", "Status", "Business", "Client", "Issue date", "Due date", "Currency", "Subtotal", "Tax", "Total", "Paid", "Balance"],
    rows.map((i) => [
      i.number, i.status, i.businessName, i.clientName, i.issueDate, i.dueDate, i.currency,
      centsToDecimal(i.subtotalCents), centsToDecimal(i.taxCents), centsToDecimal(i.totalCents), centsToDecimal(i.paidCents),
      centsToDecimal(i.totalCents - i.paidCents),
    ]),
  );
  return new Response(body, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="ledger-invoices.csv"', "cache-control": "no-store" },
  });
}
