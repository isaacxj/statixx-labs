import { notFound } from "next/navigation";
import { InvoicePreview } from "@/app/(app)/invoices/invoice-preview";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { balanceCents } from "@/lib/payments";
import { isShareToken } from "@/lib/share-link";
import { getInvoiceByToken } from "@/server/db/queries";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice", robots: { index: false, follow: false } };

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = isShareToken(token) ? await getInvoiceByToken(token) : null;
  if (!found) notFound();
  const { invoice, items, business, client } = found;
  const balance = balanceCents(invoice.totalCents, invoice.paidCents);
  const paid = invoice.status === "paid";
  const voided = invoice.status === "void";
  const money = (c: number) => formatMoney(c, invoice.currency);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-6 md:py-10 print:max-w-none print:gap-4 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-muted-foreground text-13">
          {business.name} sent you invoice <span className="font-mono">{invoice.number}</span>
        </p>
        <PrintButton />
      </div>
      <div className="relative break-inside-avoid">
        <InvoicePreview
          business={{ ...business, hasLogo: !!business.logoKey }}
          client={client}
          number={invoice.number}
          issueDate={invoice.issueDate}
          dueDate={invoice.dueDate}
          items={items}
          notes={invoice.notesMd}
        />
        {(paid || voided) && (
          <span
            aria-label={paid ? "Paid in full" : "Void"}
            className={`pointer-events-none absolute top-24 right-6 -rotate-12 rounded-card border-2 px-3 py-1 text-xl font-semibold tracking-widest uppercase md:right-10 ${
              paid ? "text-success border-success" : "text-danger border-danger"
            }`}
          >
            {paid ? "Paid" : "Void"}
          </span>
        )}
      </div>
      {!voided && (
        <section aria-labelledby="pay-heading" className="bg-card rounded-card flex break-inside-avoid flex-col gap-4 border p-5 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="pay-heading" className="text-base font-semibold">{paid ? "Payment received" : "Balance due"}</h2>
            {!paid && invoice.status === "overdue" && <Badge tone="danger">Overdue</Badge>}
            <span className="font-mono text-2xl font-semibold tabular-nums">{money(paid ? invoice.paidCents : balance)}</span>
          </div>
          {!paid && <p className="text-muted-foreground text-13">Due {formatDate(invoice.dueDate)}.</p>}
          {!paid && business.paymentInstructionsMd && (
            <div className="border-t pt-4">
              <h3 className="text-13 mb-1 font-medium">How to pay</h3>
              <p className="text-13 whitespace-pre-line">{business.paymentInstructionsMd}</p>
            </div>
          )}
          {invoice.paidCents > 0 && !paid && (
            <p className="text-muted-foreground text-13">{money(invoice.paidCents)} received so far.</p>
          )}
        </section>
      )}
    </div>
  );
}
