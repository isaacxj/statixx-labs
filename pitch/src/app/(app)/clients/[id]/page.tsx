import { notFound } from "next/navigation";
import { ClientForm } from "@/components/client-form";
import { getClient } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const client = await getClient(Number((await params).id));
  if (!client) notFound();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        {client.company ? <p className="text-muted-foreground mt-1 text-sm">{client.company}</p> : null}
      </div>
      <ClientForm client={client} />
    </div>
  );
}
