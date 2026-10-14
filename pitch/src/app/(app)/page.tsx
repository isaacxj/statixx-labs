import Link from "next/link";
import { Card } from "@/components/ui/card";
import { describeEvent } from "@/lib/activity";
import { computeDashboard, type Money } from "@/lib/dashboard";
import { daysSince } from "@/lib/expiry";
import { formatMoney } from "@/lib/money";
import { expireDueProposals, listDashboardProposals, listFollowUps, listRecentActivity } from "@/server/db/queries";
import type { ProposalStatus } from "@/server/db/schema";

export const dynamic = "force-dynamic";

const barFill: Record<ProposalStatus, string> = {
  draft: "fill-muted-foreground",
  sent: "fill-info",
  viewed: "fill-warning",
  accepted: "fill-success",
  declined: "fill-destructive",
  expired: "fill-border",
};

const whenFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const when = (utc: string) => whenFmt.format(new Date(`${utc.replace(" ", "T")}Z`));

function MoneyLines({ list }: { list: Money[] }) {
  if (list.length === 0) return <span className="tabular font-mono">{formatMoney(0)}</span>;
  return (
    <>
      {list.map((m) => (
        <span key={m.currency} className="tabular block font-mono">{formatMoney(m.cents, m.currency)}{list.length > 1 && <span className="text-muted-foreground ml-1.5 text-xs">{m.currency}</span>}</span>
      ))}
    </>
  );
}

function Kpi({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-muted-foreground text-[13px]">{label}</p>
      <div className="text-2xl font-semibold">{children}</div>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </Card>
  );
}

export default async function Home() {
  await expireDueProposals();
  const now = new Date();
  const [proposals, followUps, activity] = await Promise.all([listDashboardProposals(), listFollowUps(now), listRecentActivity(8)]);
  const d = computeDashboard(proposals, now);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Open value" hint="Sent or viewed, one-time">
          <MoneyLines list={d.openValue} />
        </Kpi>
        <Kpi label="Sent this month" hint="Proposals sent since the 1st">
          <span className="tabular font-mono">{d.sentThisMonth}</span>
        </Kpi>
        <Kpi label="Acceptance rate" hint="Accepted of answered">
          <span className="tabular font-mono">{d.acceptanceRate === null ? "—" : `${Math.round(d.acceptanceRate * 100)}%`}</span>
        </Kpi>
        <Kpi label="Avg days to accept" hint="From sent to accepted">
          <span className="tabular font-mono">{d.avgDaysToAccept === null ? "—" : d.avgDaysToAccept.toFixed(1)}</span>
        </Kpi>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="follow-h" className="bg-card rounded-md border">
          <h2 id="follow-h" className="border-b px-4 py-3 text-base font-semibold">Needs follow-up</h2>
          {followUps.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-sm">Nothing waiting. Viewed proposals with no answer after 3 days show up here.</p>
          ) : (
            <ul className="divide-y">
              {followUps.map((f) => (
                <li key={f.id}>
                  <Link href={`/proposals/${f.id}`} className="hover:bg-accent flex flex-col gap-0.5 px-4 py-3 transition-colors max-md:min-h-11">
                    <span className="font-medium"><span className="tabular mr-2 font-mono text-[13px]">{f.number}</span>{f.title}</span>
                    <span className="text-muted-foreground text-sm">{f.clientName}{f.clientCompany ? ` · ${f.clientCompany}` : ""} · viewed {f.firstViewedAt ? daysSince(f.firstViewedAt, now) : 0} days ago</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="act-h" className="bg-card rounded-md border">
          <h2 id="act-h" className="border-b px-4 py-3 text-base font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-sm">No activity yet. Send a proposal to see it here.</p>
          ) : (
            <ul className="divide-y">
              {activity.map((a) => (
                <li key={a.id}>
                  <Link href={`/proposals/${a.proposalId}`} className="hover:bg-accent flex items-baseline justify-between gap-4 px-4 py-3 transition-colors max-md:min-h-11">
                    <span className="min-w-0">
                      <span className="block font-medium">{describeEvent(a.type, a.metaJson)}</span>
                      <span className="text-muted-foreground block truncate text-sm"><span className="tabular font-mono text-[13px]">{a.number}</span> · {a.title} · {a.clientName}</span>
                    </span>
                    <time className="tabular text-muted-foreground shrink-0 text-xs">{when(a.at)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="val-h" className="bg-card rounded-md border">
        <h2 id="val-h" className="border-b px-4 py-3 text-base font-semibold">Value by status</h2>
        {d.valueByStatus.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-4 py-6">
            <p className="text-muted-foreground text-sm">No proposals yet.</p>
            <Link href="/proposals/new" className="text-primary text-sm font-medium hover:underline">Create your first proposal</Link>
          </div>
        ) : (
          d.valueByStatus.map((g) => {
            const max = Math.max(...g.rows.map((r) => r.cents), 1);
            return (
              <div key={g.currency} className="flex flex-col gap-2 px-4 py-4">
                {d.valueByStatus.length > 1 && <h3 className="text-muted-foreground text-xs font-medium">{g.currency}</h3>}
                <ul className="flex flex-col gap-2">
                  {g.rows.map((r) => (
                    <li key={r.status} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 text-sm max-md:grid-cols-[4.5rem_1fr_auto]">
                      <span className="capitalize">{r.status}<span className="tabular text-muted-foreground ml-1 text-xs">{r.count}</span></span>
                      <svg role="img" aria-label={`${r.status}: ${formatMoney(r.cents, g.currency)}`} className="h-2 w-full" preserveAspectRatio="none">
                        <rect width="100%" height="100%" rx="4" className="fill-muted" />
                        <rect width={`${(r.cents / max) * 100}%`} height="100%" rx="4" className={barFill[r.status]} />
                      </svg>
                      <span className="tabular w-28 text-right font-mono text-[13px]">{formatMoney(r.cents, g.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
