import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseStatusFilter } from "@/lib/proposal-form";
import { cn } from "@/lib/utils";
import { countProposalsByStatus, listProposals } from "@/server/db/queries";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/server/db/schema";

export const dynamic = "force-dynamic";

const statusBadge: Record<ProposalStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  sent: "info",
  viewed: "warning",
  accepted: "success",
  declined: "danger",
  expired: "neutral",
};

const dateFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" });
const formatDate = (utc: string | null) => (utc ? dateFmt.format(new Date(`${utc.replace(" ", "T")}Z`)) : "—");

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; created?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = parseStatusFilter(sp.status);
  const [rows, counts] = await Promise.all([listProposals({ status, query: q }), countProposalsByStatus()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const href = (s: ProposalStatus | null) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/proposals?${qs}` : "/proposals";
  };
  const tabs: { key: ProposalStatus | null; label: string; n: number }[] = [
    { key: null, label: "All", n: total },
    ...PROPOSAL_STATUSES.map((s) => ({ key: s, label: s[0].toUpperCase() + s.slice(1), n: counts[s] ?? 0 })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Proposals</h1>
        <Link href="/proposals/new" className={buttonVariants()}><Plus />New proposal</Link>
      </div>
      {sp.created && (
        <p role="status" className="bg-success/10 text-success border-success/30 rounded-md border px-4 py-2 text-sm">
          Draft <span className="tabular font-medium">{sp.created}</span> created.
        </p>
      )}
      <nav aria-label="Proposal status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={href(t.key)}
            aria-current={t.key === status ? "page" : undefined}
            className={cn(
              "text-muted-foreground hover:bg-muted flex h-8 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-sm transition-colors duration-150 max-md:h-11",
              t.key === status && "bg-accent text-accent-foreground font-medium",
            )}
          >
            {t.label}
            <span className="tabular text-xs">{t.n}</span>
          </Link>
        ))}
      </nav>
      <form role="search" className="relative max-w-sm">
        {status && <input type="hidden" name="status" value={status} />}
        <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input name="q" type="search" defaultValue={q} placeholder="Search number, title or client" aria-label="Search proposals" className="pl-9" />
      </form>
      {rows.length === 0 ? (
        <div className="bg-card flex flex-col items-start gap-3 rounded-md border p-6">
          <p className="font-medium">{q || status ? "No proposals match." : "No proposals yet."}</p>
          <Link href={q || status ? "/proposals" : "/proposals/new"} className={buttonVariants({ variant: "outline" })}>
            {q || status ? "Clear filters" : "Create your first proposal"}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full min-w-[44rem] text-left">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Number</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Business</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-accent transition-colors">
                  <td className="tabular px-4 py-3 font-mono text-[13px] whitespace-nowrap">{r.number}</td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.clientName}{r.clientCompany ? ` · ${r.clientCompany}` : ""}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.businessName}</td>
                  <td className="px-4 py-3"><Badge variant={statusBadge[r.status]}>{r.status}</Badge></td>
                  <td className="tabular px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(r.sentAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
