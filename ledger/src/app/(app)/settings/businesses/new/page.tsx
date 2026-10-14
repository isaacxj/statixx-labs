import { BusinessForm } from "../../business-form";

export const metadata = { title: "New business · Ledger" };

export default function NewBusinessPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New business</h1>
      <BusinessForm
        defaults={{ id: null, name: "", legalName: "", address: "", accent: "#10b981", currency: "USD", taxRate: "0", termsDays: "30", paymentInstructions: "", numberPrefix: "", hasLogo: false }}
      />
    </div>
  );
}
