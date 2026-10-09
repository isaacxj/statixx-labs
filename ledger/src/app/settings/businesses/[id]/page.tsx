import { notFound } from "next/navigation";
import { getBusiness } from "@/server/db/queries";
import { BusinessForm } from "../../business-form";

export const dynamic = "force-dynamic";

export default async function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = /^\d+$/.test(id) ? await getBusiness(Number(id)) : null;
  if (!b) notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{b.name}</h1>
      <BusinessForm
        defaults={{
          id: b.id, name: b.name, legalName: b.legalName, address: b.address, accent: b.accent, currency: b.currency,
          taxRate: String(b.taxRateBp / 100), termsDays: String(b.termsDays), paymentInstructions: b.paymentInstructionsMd,
          numberPrefix: b.numberPrefix, hasLogo: b.logoKey !== null,
        }}
      />
    </div>
  );
}
