import { chicagoDate, toDate } from "@/lib/expiry";
import { proposalTotals, type PricedItem } from "@/lib/pricing";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/server/db/schema";

export type DashProposal = {
  status: ProposalStatus;
  currency: "USD" | "CAD";
  discountBp: number;
  taxRateBp: number;
  sentAt: string | null;
  acceptedAt: string | null;
  items: PricedItem[];
};

export type Money = { currency: "USD" | "CAD"; cents: number };

/** A proposal's value is its one-time total (after discount and tax); monthly items are not counted. */
export const proposalValue = (p: DashProposal) => proposalTotals(p.items, p.discountBp, p.taxRateBp).oneTime.total;

function addMoney(list: Money[], currency: Money["currency"], cents: number) {
  const hit = list.find((m) => m.currency === currency);
  if (hit) hit.cents += cents;
  else list.push({ currency, cents });
}

export type StatusBar = { status: ProposalStatus; count: number; cents: number };

export function computeDashboard(proposals: DashProposal[], now: Date) {
  const openValue: Money[] = [];
  const month = chicagoDate(now).slice(0, 7);
  let sentThisMonth = 0;
  let accepted = 0;
  let declined = 0;
  const acceptDays: number[] = [];
  const bars = new Map<Money["currency"], StatusBar[]>();

  for (const p of proposals) {
    const value = proposalValue(p);
    if (p.status === "sent" || p.status === "viewed") addMoney(openValue, p.currency, value);
    if (p.sentAt && chicagoDate(toDate(p.sentAt)).slice(0, 7) === month) sentThisMonth++;
    if (p.status === "accepted") {
      accepted++;
      if (p.sentAt && p.acceptedAt) acceptDays.push((toDate(p.acceptedAt).getTime() - toDate(p.sentAt).getTime()) / 86_400_000);
    }
    if (p.status === "declined") declined++;
    let rows = bars.get(p.currency);
    if (!rows) {
      rows = PROPOSAL_STATUSES.map((status) => ({ status, count: 0, cents: 0 }));
      bars.set(p.currency, rows);
    }
    const row = rows.find((r) => r.status === p.status)!;
    row.count++;
    row.cents += value;
  }

  const answered = accepted + declined;
  return {
    openValue,
    sentThisMonth,
    acceptanceRate: answered ? accepted / answered : null,
    avgDaysToAccept: acceptDays.length ? acceptDays.reduce((a, b) => a + b, 0) / acceptDays.length : null,
    valueByStatus: [...bars.entries()].map(([currency, rows]) => ({ currency, rows })),
  };
}
