import { BusinessForm } from "@/components/business-form";

export default function NewBusinessPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New business profile</h1>
      <BusinessForm />
    </div>
  );
}
