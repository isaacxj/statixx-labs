import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProposalForm } from "@/components/proposal-form";
import { listBusinesses, listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const [businesses, clients] = await Promise.all([listBusinesses(), listClients()]);
  const missing = businesses.length === 0 ? { href: "/settings/new", label: "Add a business profile" } : clients.length === 0 ? { href: "/clients/new", label: "Add a client" } : null;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New proposal</h1>
      {missing ? (
        <div className="bg-card flex max-w-2xl flex-col items-start gap-3 rounded-md border p-6">
          <p className="font-medium">A proposal needs a business and a client first.</p>
          <Link href={missing.href} className={buttonVariants()}>{missing.label}</Link>
        </div>
      ) : (
        <ProposalForm businesses={businesses} clients={clients} />
      )}
    </div>
  );
}
