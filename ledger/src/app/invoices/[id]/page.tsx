import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInvoice } from "@/server/db/queries";
import { InvoiceEditor } from "../invoice-editor";
import { InvoicePreview } from "../invoice-preview";
import { centsToText, loadEditorOptions, qtyToText, rateText } from "../editor-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice · Ledger" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = /^\d+$/.test(id) ? await getInvoice(Number(id)) : null;
  if (!found) notFound();
  const { invoice, items } = found;
  const { businesses, clients } = await loadEditorOptions();
  const business = businesses.find((b) => b.id === invoice.businessId);
  if (!business) notFound();
  const editable = invoice.status === "draft";
  return (
    <div className="flex flex-col gap-6">
      <Link href="/invoices" className="text-muted-foreground hover:text-foreground text-13 inline-flex w-fit items-center gap-1">
        <ChevronLeft className="size-4" />Invoices
      </Link>
      <header className="flex items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{invoice.number}</h1>
        <Badge tone={invoice.status === "draft" ? "neutral" : "info"} className="capitalize">{invoice.status.replace("_", " ")}</Badge>
      </header>
      {editable ? (
        <InvoiceEditor
          businesses={businesses}
          clients={clients}
          defaults={{
            id: invoice.id,
            number: invoice.number,
            businessId: invoice.businessId,
            clientId: invoice.clientId,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            notes: invoice.notesMd,
            items: items.map((i) => ({
              description: i.description,
              qty: qtyToText(i.qtyMilli),
              unitPrice: centsToText(i.unitPriceCents),
              taxRate: rateText(i.taxRateBp),
            })),
          }}
        />
      ) : (
        <div className="max-w-3xl">
          <InvoicePreview
            business={business}
            client={clients.find((c) => c.id === invoice.clientId) ?? null}
            number={invoice.number}
            issueDate={invoice.issueDate}
            dueDate={invoice.dueDate}
            items={items}
            notes={invoice.notesMd}
          />
        </div>
      )}
    </div>
  );
}
