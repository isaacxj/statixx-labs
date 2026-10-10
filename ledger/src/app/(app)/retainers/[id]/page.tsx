import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { qtyToText, centsToText, rateText } from "../../invoices/editor-data";
import { loadEditorOptions } from "../../invoices/editor-data";
import { getRetainer } from "@/server/db/queries";
import type { RetainerItem } from "@/lib/retainer-form";
import { RetainerEditor } from "../retainer-editor";

export const dynamic = "force-dynamic";

export default async function RetainerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const retainer = /^\d+$/.test(id) ? await getRetainer(Number(id)) : null;
  if (!retainer) notFound();
  const { businesses, clients } = await loadEditorOptions();
  const items = JSON.parse(retainer.itemsJson) as RetainerItem[];
  return (
    <div className="flex flex-col gap-6">
      <Link href="/retainers" className="text-muted-foreground hover:text-foreground text-13 inline-flex w-fit items-center gap-1">
        <ChevronLeft className="size-4" />Retainers
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{retainer.title}</h1>
      <RetainerEditor
        businesses={businesses.map(({ id, name, currency, taxRate }) => ({ id, name, currency, taxRate }))}
        clients={clients.map(({ id, name, company }) => ({ id, name, company }))}
        defaults={{
          id: retainer.id,
          businessId: retainer.businessId,
          clientId: retainer.clientId,
          title: retainer.title,
          cadence: retainer.cadence,
          anchorDay: String(retainer.anchorDay),
          startsOn: retainer.startsOn,
          endsOn: retainer.endsOn ?? "",
          active: retainer.active,
          items: items.map((i) => ({
            description: i.description,
            qty: qtyToText(i.qtyMilli),
            unitPrice: centsToText(i.unitPriceCents),
            taxRate: rateText(i.taxRateBp),
          })),
        }}
      />
    </div>
  );
}

export const metadata = { title: "Retainer · Ledger" };
