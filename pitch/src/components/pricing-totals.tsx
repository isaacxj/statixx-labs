"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { savePricingTermsAction } from "@/app/(app)/proposals/[id]/actions";
import { bpToInput, parseRateBp, proposalTotals } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";
import type { LineItem } from "@/server/db/schema";

type Props = {
  proposalId: number;
  currency: "USD" | "CAD";
  lines: LineItem[];
  discountBp: number;
  taxRateBp: number;
  onTerms: (t: { discountBp: number; taxRateBp: number }) => void;
  onSaving: (saving: boolean) => void;
};

export function PricingTotals({ proposalId, currency, lines, discountBp, taxRateBp, onTerms, onSaving }: Props) {
  const [discount, setDiscount] = useState(bpToInput(discountBp));
  const [tax, setTax] = useState(bpToInput(taxRateBp));
  const totals = proposalTotals(lines, discountBp, taxRateBp);
  const hasMonthly = totals.monthly.subtotal > 0;

  const commit = async () => {
    const d = parseRateBp(discount);
    const t = parseRateBp(tax);
    if (d === null || t === null) {
      setDiscount(bpToInput(discountBp));
      setTax(bpToInput(taxRateBp));
      return;
    }
    if (d === discountBp && t === taxRateBp) return;
    onSaving(true);
    try {
      await savePricingTermsAction(proposalId, discount, tax);
      onTerms({ discountBp: d, taxRateBp: t });
    } finally {
      onSaving(false);
    }
  };

  const money = (c: number) => formatMoney(c, currency);
  return (
    <section aria-label="Proposal totals" className="bg-card flex flex-col gap-3 rounded-md border p-4">
      <h2 className="text-sm font-medium">Totals</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Discount %</span>
          <Input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} onBlur={() => void commit()} className="tabular font-mono" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Tax %</span>
          <Input inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} onBlur={() => void commit()} className="tabular font-mono" />
        </label>
      </div>
      <Block title="One-time" t={totals.oneTime} money={money} />
      {hasMonthly ? <Block title="Monthly" t={totals.monthly} money={money} suffix="/mo" /> : null}
    </section>
  );
}

function Block({ title, t, money, suffix }: { title: string; t: { subtotal: number; discount: number; tax: number; total: number }; money: (c: number) => string; suffix?: string }) {
  return (
    <dl className="tabular flex flex-col gap-1 border-t pt-3 font-mono text-sm">
      <p className="text-muted-foreground font-sans text-xs">{title}</p>
      <Line label="Subtotal" value={money(t.subtotal)} />
      {t.discount > 0 ? <Line label="Discount" value={`−${money(t.discount)}`} /> : null}
      {t.tax > 0 ? <Line label="Tax" value={money(t.tax)} /> : null}
      <Line label="Total" value={`${money(t.total)}${suffix ? ` ${suffix}` : ""}`} strong />
    </dl>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <dt className="text-muted-foreground font-sans">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
