import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isTeamRequest } from "@/lib/activity";
import { Markdown } from "@/components/markdown";
import { formatMoney } from "@/lib/money";
import { counts, lineTotal, proposalTotals } from "@/lib/pricing";
import { accentForeground, isShareToken, safeAccent } from "@/lib/share";
import { getPublicProposal, recordProposalView } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

const dateFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" });
const formatDate = (utc: string) => dateFmt.format(new Date(utc.includes("T") ? utc : `${utc.replace(" ", "T")}Z`));

export default async function ClientProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const data = isShareToken(token) ? await getPublicProposal(token) : null;
  if (!data) notFound();
  if (data.proposal.status !== "draft" && !isTeamRequest(await headers())) await recordProposalView(data.proposal.id);
  const { proposal: p, sections, lines } = data;

  const accent = safeAccent(p.businessAccent);
  const money = (c: number) => formatMoney(c, p.currency);
  const totals = proposalTotals(lines, p.discountBp, p.taxRateBp);
  const hasMonthly = totals.monthly.subtotal > 0;
  const hasPricing = sections.some((s) => s.kind === "pricing");
  const style = { "--primary": accent, "--primary-foreground": accentForeground(accent) } as React.CSSProperties;

  return (
    <div style={style} className="bg-background text-foreground min-h-screen">
      {p.status === "draft" ? (
        <p role="status" className="bg-warning/10 text-warning border-b px-4 py-2 text-center text-sm">
          Preview. This proposal hasn&apos;t been sent yet.
        </p>
      ) : null}
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
              {p.validUntil ? ` · Valid until ${formatDate(p.validUntil)}` : ""}
            </p>
          </div>
        </header>

        {sections.map((s) => (
          <section key={s.id} aria-labelledby={`s-${s.id}`} className="flex flex-col gap-3">
            <h2 id={`s-${s.id}`} className="text-xl font-semibold">{s.title}</h2>
            {s.kind === "text" ? (
              <Markdown source={s.bodyMd} />
            ) : (
              <PricingTable items={lines.filter((l) => l.sectionId === s.id)} money={money} />
            )}
          </section>
        ))}

        {hasPricing ? (
          <section aria-label="Summary" className="bg-card sticky bottom-0 flex flex-col gap-2 rounded-lg border p-4 md:static">
            <SummaryBlock label="Total" t={totals.oneTime} money={money} show={totals.oneTime.subtotal > 0 || !hasMonthly} />
            {hasMonthly ? <SummaryBlock label="Monthly" t={totals.monthly} money={money} suffix="/mo" show /> : null}
          </section>
        ) : null}

        {p.businessAddress ? <footer className="text-muted-foreground border-t pt-6 text-xs whitespace-pre-line">{p.businessAddress}</footer> : null}
      </main>
    </div>
  );
}

type Item = Awaited<ReturnType<typeof getPublicProposal>> extends infer R ? (R extends { lines: (infer L)[] } ? L : never) : never;

function PricingTable({ items, money }: { items: Item[]; money: (c: number) => string }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground bg-muted/50 text-left text-xs">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">Item</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Qty</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Price</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((i) => (
            <tr key={i.id} className={counts(i) ? "" : "text-muted-foreground"}>
              <td className="px-4 py-3">
                {i.description || "Untitled item"}
                {i.optional ? <span className="bg-muted text-muted-foreground ml-2 rounded-sm px-1.5 py-0.5 text-xs">Optional</span> : null}
                {i.recurring === "monthly" ? <span className="text-muted-foreground ml-2 text-xs">monthly</span> : null}
              </td>
              <td className="tabular px-4 py-3 text-right font-mono">{i.qtyMilli / 1000}</td>
              <td className="tabular px-4 py-3 text-right font-mono">{money(i.unitPriceCents)}</td>
              <td className="tabular px-4 py-3 text-right font-mono">{money(lineTotal(i))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryBlock({ label, t, money, suffix, show }: { label: string; t: { subtotal: number; discount: number; tax: number; total: number }; money: (c: number) => string; suffix?: string; show: boolean }) {
  if (!show) return null;
  return (
    <dl className="tabular flex flex-col gap-1 font-mono text-sm">
      {t.discount > 0 || t.tax > 0 ? (
        <>
          <Row label="Subtotal" value={money(t.subtotal)} />
          {t.discount > 0 ? <Row label="Discount" value={`−${money(t.discount)}`} /> : null}
          {t.tax > 0 ? <Row label="Tax" value={money(t.tax)} /> : null}
        </>
      ) : null}
      <Row label={label} value={`${money(t.total)}${suffix ? ` ${suffix}` : ""}`} strong />
    </dl>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}>
      <dt className="text-muted-foreground font-sans">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
