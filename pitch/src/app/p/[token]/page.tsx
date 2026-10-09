import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isTeamRequest } from "@/lib/activity";
import { Markdown } from "@/components/markdown";
import { canRespond } from "@/lib/respond";
import { ClientPricingTable, ClientSummary, ResponseProvider } from "@/components/client-pricing";
import { accentForeground, isShareToken, safeAccent } from "@/lib/share";
import { expireDueProposals, getPublicProposal, recordProposalView } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

const dateFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
/** Valid-until is a calendar date, not an instant, so it is formatted without a timezone shift. */
const formatDay = (ymd: string) => dayFmt.format(new Date(`${ymd}T00:00:00Z`));
const formatDate = (utc: string) => dateFmt.format(new Date(utc.includes("T") ? utc : `${utc.replace(" ", "T")}Z`));

export default async function ClientProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  if (isShareToken(token)) await expireDueProposals();
  const data = isShareToken(token) ? await getPublicProposal(token) : null;
  if (!data) notFound();
  if (data.proposal.status !== "draft" && !isTeamRequest(await headers())) await recordProposalView(data.proposal.id);
  const { proposal: p, sections, lines } = data;

  const accent = safeAccent(p.businessAccent);
  const hasPricing = sections.some((s) => s.kind === "pricing");
  const style = { "--primary": accent, "--primary-foreground": accentForeground(accent) } as React.CSSProperties;

  return (
    <div style={style} className="bg-background text-foreground min-h-screen">
      {p.status === "draft" ? (
        <p role="status" className="bg-warning/10 text-warning border-b px-4 py-2 text-center text-sm">
          Preview. This proposal hasn&apos;t been sent yet.
        </p>
      ) : null}
      <ResponseProvider token={token} lines={lines} currency={p.currency} discountBp={p.discountBp} taxRateBp={p.taxRateBp} open={canRespond(p.status)}>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 md:py-16">
        <header className="flex flex-col gap-6 border-b pb-8">
          <div className="flex items-center gap-3">
            {p.hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/p/${token}/logo`} alt="" className="size-10 rounded-sm object-contain" />
            ) : (
              <span aria-hidden className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-sm text-base font-semibold">
                {p.businessName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="flex flex-col">
              <span className="font-semibold">{p.businessName}</span>
              {p.businessLegalName ? <span className="text-muted-foreground text-xs">{p.businessLegalName}</span> : null}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-primary tabular font-mono text-[13px]">{p.number}</p>
            <h1 className="text-[32px] leading-tight font-semibold">{p.title}</h1>
            <p className="text-muted-foreground text-sm">
              Prepared for {p.clientName}
              {p.clientCompany ? `, ${p.clientCompany}` : ""}
              {p.sentAt ? ` · ${formatDate(p.sentAt)}` : ""}
              {p.validUntil ? ` · Valid until ${formatDay(p.validUntil)}` : ""}
            </p>
          </div>
        </header>

        {sections.map((s) => (
          <section key={s.id} aria-labelledby={`s-${s.id}`} className="flex flex-col gap-3">
            <h2 id={`s-${s.id}`} className="text-xl font-semibold">{s.title}</h2>
            {s.kind === "text" ? (
              <Markdown source={s.bodyMd} />
            ) : (
              <ClientPricingTable sectionId={s.id} />
            )}
          </section>
        ))}

        {p.status === "accepted" ? (
          <p role="status" className="bg-success/10 text-success rounded-lg border p-4 text-sm">
            Accepted by {p.acceptedByName}{p.acceptedAt ? ` on ${formatDate(p.acceptedAt)}` : ""}. Thank you.
          </p>
        ) : null}
        {p.status === "expired" ? (
          <p role="status" className="bg-muted text-muted-foreground rounded-lg border p-4 text-sm">
            This proposal expired{p.validUntil ? ` on ${formatDay(p.validUntil)}` : ""} and can no longer be accepted. Contact {p.businessName} to request an updated one.
          </p>
        ) : null}
        {p.status === "declined" ? (
          <p role="status" className="bg-muted text-muted-foreground rounded-lg border p-4 text-sm">
            This proposal was declined{p.declinedAt ? ` on ${formatDate(p.declinedAt)}` : ""}.
          </p>
        ) : null}

        {hasPricing ? <ClientSummary /> : null}

        {p.businessAddress ? <footer className="text-muted-foreground border-t pt-6 text-xs whitespace-pre-line">{p.businessAddress}</footer> : null}
      </main>
      </ResponseProvider>
    </div>
  );
}
