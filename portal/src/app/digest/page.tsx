import Link from "next/link";
import { notFound } from "next/navigation";
import { buildDigest, sinceUtc, type DigestLine } from "@/lib/digest";
import { todayInChicago } from "@/lib/milestones";
import { getDigestData } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";

export const dynamic = "force-dynamic";

function Section({ id, title, lines, empty }: { id: string; title: string; lines: DigestLine[]; empty: string }) {
  return (
    <section aria-labelledby={id} className="bg-card flex flex-col gap-3 rounded-lg border p-4">
      <h2 id={id} className="text-sm font-semibold">
        {title} <span className="text-muted-foreground font-mono tabular-nums">{lines.length}</span>
      </h2>
      {lines.length === 0 ? (
        <p className="text-muted-foreground text-sm">{empty}</p>
      ) : (
        <ul className="divide-border divide-y">
          {lines.map((l) => (
            <li key={l.key} className="py-2 first:pt-0 last:pb-0">
              <Link href={`/projects/${l.projectId}`} className="block text-sm font-medium hover:underline">
                {l.title}
              </Link>
              <span className="text-muted-foreground block text-xs">
                {l.clientName} · {l.projectName}
              </span>
              <span className="text-muted-foreground block font-mono text-xs tabular-nums">{l.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function DigestPage() {
  if ((await getCurrentUser()).kind !== "team") notFound();
  const now = new Date();
  const digest = buildDigest(await getDigestData(), sinceUtc(now), todayInChicago(now));
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Morning digest</h1>
        <p className="text-muted-foreground">What the team email would say right now: the last 24 hours plus anything overdue.</p>
      </header>
      <p className="bg-card rounded-md border p-4 text-sm">
        <span className="text-muted-foreground">Subject </span>
        <span className="font-medium">{digest.subject}</span>
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <Section id="digest-requests" title="New requests" lines={digest.newRequests} empty="No new requests in the last 24 hours." />
        <Section id="digest-decisions" title="Approval decisions" lines={digest.decisions} empty="No approvals decided in the last 24 hours." />
        <Section id="digest-overdue" title="Overdue milestones" lines={digest.overdueMilestones} empty="No milestones are overdue." />
      </div>
      <section aria-labelledby="digest-text" className="flex flex-col gap-2">
        <h2 id="digest-text" className="text-base font-semibold">Email body</h2>
        <pre className="bg-card text-muted-foreground overflow-x-auto rounded-md border p-4 font-mono text-xs whitespace-pre-wrap">{digest.text}</pre>
      </section>
    </div>
  );
}
