import { listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Clients</h1>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-left">
          <thead className="border-b text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Company</th>
              <th className="px-4 py-2 font-medium">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.company}</td>
                <td className="tabular px-4 py-3 text-muted-foreground">{c.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
