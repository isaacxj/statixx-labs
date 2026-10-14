import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { UptimeBars } from "@/components/uptime-bars";
import { INCIDENT_STATUS_LABELS } from "@/lib/incident-form";
import { formatCheckedAt } from "@/lib/monitors";
import { OVERALL_COPY, overallStatus, publicIncidentTitle, safeAccent } from "@/lib/public-status";
import { formatDuration } from "@/lib/status";
import { dailyUptime, formatUptime, nowMs, uptimePercent } from "@/lib/uptime";
import { cn } from "@/lib/utils";
import { getPublicStatusPage } from "@/server/db/queries";

export const dynamic = "force-dynamic";

const DAY = 24 * 3600_000;
const BANNER_TONE = { up: "border-status-up/40 bg-status-up/10 text-status-up", degraded: "border-status-degraded/40 bg-status-degraded/10 text-status-degraded", down: "border-status-down/40 bg-status-down/10 text-status-down" } as const;

async function load(slug: string) {
  return getPublicStatusPage(slug, new Date(nowMs() - 90 * DAY).toISOString().slice(0, 19).replace("T", " "));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await load(slug);
  return { title: found?.page.title ?? "Status", robots: { index: false } };
}

export default async function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) notFound();
  const { page, components, checks, incidents, updates } = found;

  const now = nowMs();
  const overall = OVERALL_COPY[overallStatus(components.map((c) => c.status))];
  const BannerIcon = { up: CheckCircle2, degraded: AlertTriangle, down: XCircle }[overall.kind as "up" | "degraded" | "down"];
  const names = new Map(components.map((c) => [c.monitorId, c.displayName]));
  const updatesFor = (incidentId: number) => updates.filter((u) => u.incidentId === incidentId);
  const active = incidents.filter((i) => !i.resolvedAt);
  const past = incidents.filter((i) => i.resolvedAt).slice(0, 10);
  const lastUpdated = components.map((c) => c.lastCheckedAt).filter((t): t is string => t !== null).sort().at(-1) ?? null;
  const intro = page.introMd.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="min-h-dvh" style={{ ["--page-accent" as string]: safeAccent(page.accent) }}>
      <div className="h-1" style={{ backgroundColor: "var(--page-accent)" }} aria-hidden />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 md:py-12">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
          {intro.map((p, i) => (
            <p key={i} className="text-muted-foreground mt-2 text-sm">{p}</p>
          ))}
        </header>

        <section aria-label="Overall status" className={cn("flex items-center gap-3 rounded-lg border p-4", BANNER_TONE[overall.kind as keyof typeof BANNER_TONE])}>
          <BannerIcon className="size-6 shrink-0" aria-hidden />
          <p className="text-lg font-semibold">{overall.label}</p>
        </section>

        {active.length > 0 && (
          <section aria-labelledby="active-heading" className="flex flex-col gap-3">
            <h2 id="active-heading" className="text-lg font-semibold">Active incidents</h2>
            <ul className="flex flex-col gap-3">
              {active.map((i) => (
                <li key={i.id} className="rounded-lg border p-4">
                  <p className="font-medium">{publicIncidentTitle(i, names.get(i.monitorId) ?? "A service")}</p>
                  <p className="text-muted-foreground mt-1 text-sm"><span className="capitalize">{i.status}</span> · started {formatCheckedAt(i.startedAt)} · {formatDuration(i.startedAt, null, now)} so far</p>
                  {updatesFor(i.id).length > 0 && (
                    <ol className="mt-3 flex flex-col gap-3 border-l pl-4">
                      {updatesFor(i.id).map((u) => (
                        <li key={u.id}>
                          <p className="text-sm"><span className="font-medium">{INCIDENT_STATUS_LABELS[u.status]}</span> <span className="text-muted-foreground">· <span className="font-mono tabular-nums">{formatCheckedAt(u.at)}</span></span></p>
                          <p className="mt-0.5 text-sm whitespace-pre-line">{u.bodyMd}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="components-heading" className="flex flex-col gap-3">
          <h2 id="components-heading" className="text-lg font-semibold">Components</h2>
          {components.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">No components are shown on this page yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {components.map((c) => {
                const points = checks.filter((p) => p.monitorId === c.monitorId);
                return (
                  <li key={c.monitorId} className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="min-w-0 truncate font-medium">{c.displayName}</h3>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-muted-foreground font-mono text-sm tabular-nums">{formatUptime(uptimePercent(points, now, 90 * DAY))}</span>
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                    <UptimeBars days={dailyUptime(points, now, 90)} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="past-heading" className="flex flex-col gap-3">
          <h2 id="past-heading" className="text-lg font-semibold">Past incidents</h2>
          {past.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">No past incidents.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {past.map((i) => (
                <li key={i.id} className="p-4">
                  <p className="font-medium">{publicIncidentTitle(i, names.get(i.monitorId) ?? "A service")}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{formatCheckedAt(i.startedAt)} · resolved after {formatDuration(i.startedAt, i.resolvedAt)}</p>
                  {updatesFor(i.id).length > 0 && (
                    <ol className="mt-3 flex flex-col gap-3 border-l pl-4">
                      {updatesFor(i.id).map((u) => (
                        <li key={u.id}>
                          <p className="text-sm"><span className="font-medium">{INCIDENT_STATUS_LABELS[u.status]}</span> <span className="text-muted-foreground">· <span className="font-mono tabular-nums">{formatCheckedAt(u.at)}</span></span></p>
                          <p className="mt-0.5 text-sm whitespace-pre-line">{u.bodyMd}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="text-muted-foreground font-mono text-xs tabular-nums">Last updated {formatCheckedAt(lastUpdated)} (Central)</footer>
      </main>
    </div>
  );
}
