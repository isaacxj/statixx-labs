import { ImportWizard } from "@/components/import/import-wizard";
import { listProjects } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const projects = (await listProjects()).filter((p) => p.status === "active").map((p) => ({ id: p.id, name: p.name, clientName: p.clientName }));
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Import</h1>
        <p className="text-muted-foreground">
          Bring in a time-entry CSV exported from Toggl or Clockify. Choose where each project goes, check the preview, then import. Times are read as
          Central time, and importing the same file twice adds nothing.
        </p>
      </header>
      <ImportWizard projects={projects} />
    </div>
  );
}
