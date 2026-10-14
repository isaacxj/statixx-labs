import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { UpdateForm } from "@/components/incident-forms";
import { INCIDENT_STATUS_LABELS } from "@/lib/incident-form";
import { formatCheckedAt } from "@/lib/monitors";
import { formatDuration } from "@/lib/status";
import { getIncident } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incidentId = Number(id);
  if (!Number.isInteger(incidentId)) notFound();
  const found = await getIncident(incidentId);
  if (!found) notFound();
  const { incident, monitorName, client, pageSlug, pageTitle, updates } = found;
  const open = incident.resolvedAt === null;
  const Icon = open ? XCircle : CheckCircle2;

  return (
    <AppShell title="Incident">
      <Link href="/incidents" className="text-muted-foreground hover:text-foreground mb-4 inline-flex min-h-11 items-center gap-1 text-sm sm:min-h-8">
        <ChevronLeft className="size-4" aria-hidden /> All incidents
      </Link>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{incident.title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {client} · {monitorName} · Started {formatCheckedAt(incident.startedAt)} ·{" "}
          <span className={`inline-flex items-center gap-1 font-medium ${open ? "text-status-down" : "text-status-up"}`}>
            <Icon className="size-3.5" aria-hidden />
            {open ? INCIDENT_STATUS_LABELS[incident.status] : "Resolved"}
          </span>{" "}
          · <span className="font-mono tabular-nums">{formatDuration(incident.startedAt, incident.resolvedAt)}</span>
        </p>
        {pageSlug ? (
          <p className="mt-1 text-sm">
            Shown on <Link href={`/s/${pageSlug}`} className="underline underline-offset-2">{pageTitle}</Link>
          </p>
        ) : null}
      </div>
      {incident.auto ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
          This incident was opened automatically after two failed checks and resolves itself on the first success. Only incidents posted on a status page take updates.
        </p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          <section aria-labelledby="updates-heading" className="min-w-0">
            <h3 id="updates-heading" className="mb-3 text-lg font-semibold">Updates</h3>
            <ol className="flex flex-col gap-4">
              {updates.map((u) => (
                <li key={u.id} className="bg-card rounded-lg border p-4">
                  <p className="text-sm font-medium">{INCIDENT_STATUS_LABELS[u.status]}</p>
                  <p className="mt-1 whitespace-pre-line">{u.bodyMd}</p>
                  <p className="text-muted-foreground mt-2 font-mono text-xs tabular-nums">{formatCheckedAt(u.at)} (Central)</p>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="post-heading" className="min-w-0">
            <h3 id="post-heading" className="mb-3 text-lg font-semibold">Post an update</h3>
            {open ? (
              <UpdateForm incidentId={incident.id} current={incident.status} />
            ) : (
              <p className="text-muted-foreground text-sm">This incident is resolved, so it takes no more updates.</p>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
