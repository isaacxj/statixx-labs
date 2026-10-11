import Link from "next/link";
import { ProjectForm } from "@/components/projects/project-form";
import { listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const clients = await listClients();
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6">
      <header>
        <p className="text-muted-foreground text-sm">
          <Link href="/projects" className="hover:underline">
            Projects
          </Link>{" "}
          / New
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
      </header>
      {clients.length === 0 ? (
        <p className="text-muted-foreground">
          Add a client first on the{" "}
          <Link href="/clients" className="text-foreground underline">
            Clients page
          </Link>
          .
        </p>
      ) : (
        <ProjectForm id={null} clients={clients} defaults={{ clientId: "", name: "", billing: "hourly", rate: "", fixedFee: "", budget: "", color: "#F59E0B" }} />
      )}
    </div>
  );
}
