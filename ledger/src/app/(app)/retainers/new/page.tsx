import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { todayChicago } from "@/lib/dates";
import { loadEditorOptions } from "../../invoices/editor-data";
import { RetainerEditor } from "../retainer-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New retainer · Ledger" };

export default async function NewRetainerPage() {
  const { businesses, clients } = await loadEditorOptions();
  if (businesses.length === 0) {
    return (
      <div className="bg-card rounded-card flex flex-col items-center gap-3 border p-10 text-center">
        <p className="font-medium">Add a business first.</p>
        <Link href="/settings/businesses/new" className="text-primary text-13 underline">Create a business</Link>
      </div>
    );
  }
  const business = businesses[0];
  return (
    <div className="flex flex-col gap-6">
      <Link href="/retainers" className="text-muted-foreground hover:text-foreground text-13 inline-flex w-fit items-center gap-1">
        <ChevronLeft className="size-4" />Retainers
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New retainer</h1>
      <RetainerEditor
        businesses={businesses.map(({ id, name, currency, taxRate }) => ({ id, name, currency, taxRate }))}
        clients={clients.map(({ id, name, company }) => ({ id, name, company }))}
        defaults={{
          id: null,
          businessId: business.id,
          clientId: null,
          title: "",
          cadence: "monthly",
          anchorDay: "1",
          startsOn: todayChicago(),
          endsOn: "",
          active: true,
          items: [{ description: "", qty: "1", unitPrice: "", taxRate: business.taxRate }],
        }}
      />
    </div>
  );
}
