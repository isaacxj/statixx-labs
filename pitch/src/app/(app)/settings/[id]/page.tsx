import { notFound } from "next/navigation";
import { BusinessForm } from "@/components/business-form";
import { getBusiness } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const business = await getBusiness(Number((await params).id));
  if (!business) notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{business.name}</h1>
      <BusinessForm business={business} />
    </div>
  );
}
