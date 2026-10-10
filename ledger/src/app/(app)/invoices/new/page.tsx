import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { addDays, todayChicago } from "@/lib/dates";
import { InvoiceEditor } from "../invoice-editor";
import { loadEditorOptions } from "../editor-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "New invoice · Ledger" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const { businesses, clients } = await loadEditorOptions();
  if (businesses.length === 0) {
    return (
      <div className="bg-card rounded-card flex flex-col items-center gap-3 border p-10 text-center">
        <p className="font-medium">Add a business first.</p>
        <p className="text-muted-foreground text-13">Invoices are issued by a business profile with its own currency and numbering.</p>
        <Link href="/settings/businesses/new" className="text-primary text-13 underline">Create a business</Link>
      </div>
    );
  }
  const business = businesses[0];
  const issueDate = todayChicago();
  const clientId = clients.find((c) => String(c.id) === client)?.id ?? null;
  return (
    <div className="flex flex-col gap-6">
      <Link href="/invoices" className="text-muted-foreground hover:text-foreground text-13 inline-flex w-fit items-center gap-1">
        <ChevronLeft className="size-4" />Invoices
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
      <InvoiceEditor
        businesses={businesses}
        clients={clients}
        defaults={{
          id: null,
          number: null,
          businessId: business.id,
          clientId,
          issueDate,
          dueDate: addDays(issueDate, business.termsDays),
          notes: "",
          items: [{ description: "", qty: "1", unitPrice: "", taxRate: business.taxRate }],
        }}
      />
    </div>
  );
}
