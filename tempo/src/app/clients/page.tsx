import { AddClientForm } from "@/components/projects/add-client-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listBusinesses, listClientsWithCounts } from "@/server/db/queries";
import { updateClientName } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [businesses, clients] = await Promise.all([listBusinesses(), listClientsWithCounts()]);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">Who your projects belong to. Rename a client by editing its name.</p>
      </header>
      <AddClientForm businesses={businesses} />
      {clients.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-card border p-6">No clients yet. Add your first one above.</p>
      ) : (
        <ul className="bg-card rounded-card divide-border divide-y border">
          {clients.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <form action={updateClientName.bind(null, c.id)} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input name="name" defaultValue={c.name} aria-label={`Name of ${c.name}`} className="sm:flex-1" />
                <span className="text-muted-foreground text-xs sm:w-56">
                  {c.businessName} · {c.projectCount} active {c.projectCount === 1 ? "project" : "projects"}
                </span>
                <Button type="submit" variant="outline" size="sm">
                  Save
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
