import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New client</h1>
      <ClientForm />
    </div>
  );
}
