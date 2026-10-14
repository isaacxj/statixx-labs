import { addDays, formatDate } from "./dates";
import { formatMoney, type CurrencyCode } from "./money";

export type DigestInvoice = {
  id: number;
  number: string;
  clientName: string;
  businessName: string;
  currency: CurrencyCode;
  dueDate: string;
  balanceCents: number;
};

export type DigestData = {
  overdue: DigestInvoice[];
  dueSoon: DigestInvoice[];
  newRetainer: DigestInvoice[];
};

export const DIGEST_SETTING = "digest_recipient";
export const DUE_SOON_DAYS = 7;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An empty recipient clears the setting; anything else must look like an email address. */
export function parseRecipient(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (value && !EMAIL.test(value)) return { ok: false, error: "Enter a valid email address." };
  return { ok: true, value };
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** "$1,200.00" or, when currencies are mixed, "$1,200.00 + CA$300.00" (one total per currency). */
export function sumLabel(list: DigestInvoice[]): string {
  const totals = new Map<CurrencyCode, number>();
  for (const i of list) totals.set(i.currency, (totals.get(i.currency) ?? 0) + i.balanceCents);
  return [...totals].map(([c, cents]) => formatMoney(cents, c)).join(" + ") || formatMoney(0);
}

export function digestIsEmpty(d: DigestData): boolean {
  return !d.overdue.length && !d.dueSoon.length && !d.newRetainer.length;
}

export function digestSubject(d: DigestData, today: string): string {
  const parts = [
    d.overdue.length && `${d.overdue.length} overdue`,
    d.dueSoon.length && `${d.dueSoon.length} due this week`,
    d.newRetainer.length && `${d.newRetainer.length} new retainer`,
  ].filter(Boolean);
  return `Ledger · ${formatDate(today)}${parts.length ? ` · ${parts.join(", ")}` : " · nothing needs attention"}`;
}

function line(i: DigestInvoice, today: string, kind: "overdue" | "due"): string {
  const days = daysBetween(i.dueDate, today);
  const when =
    kind === "overdue"
      ? `${days} day${days === 1 ? "" : "s"} overdue`
      : days === 0
        ? "due today"
        : `due ${formatDate(i.dueDate)}`;
  return `- ${i.number} · ${i.clientName} (${i.businessName}) · ${formatMoney(i.balanceCents, i.currency)} · ${when}`;
}

/** The plain-text email body for the morning digest. */
export function digestText(d: DigestData, today: string): string {
  if (digestIsEmpty(d)) return `Good morning. No overdue invoices, nothing due by ${formatDate(addDays(today, DUE_SOON_DAYS))}, and no new retainer invoices.`;
  const sections: string[] = ["Good morning."];
  if (d.overdue.length) sections.push(`Overdue (${d.overdue.length}, ${sumLabel(d.overdue)} outstanding)\n${d.overdue.map((i) => line(i, today, "overdue")).join("\n")}`);
  if (d.dueSoon.length) sections.push(`Due this week (${d.dueSoon.length}, ${sumLabel(d.dueSoon)})\n${d.dueSoon.map((i) => line(i, today, "due")).join("\n")}`);
  if (d.newRetainer.length) sections.push(`New retainer invoices (${d.newRetainer.length})\n${d.newRetainer.map((i) => line(i, today, "due")).join("\n")}`);
  return sections.join("\n\n");
}

/** A minimal RFC 5322 plain-text message, ready for Cloudflare's `EmailMessage`. */
export function buildMime({ from, to, subject, text, messageId }: { from: string; to: string; subject: string; text: string; messageId: string }): string {
  const encodedSubject = /^[\x20-\x7e]*$/.test(subject) ? subject : `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(subject)))}?=`;
  const body = btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/(.{76})/g, "$1\r\n");
  return [
    `From: Statixx Ledger <${from}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `Message-ID: <${messageId}>`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    body,
    "",
  ].join("\r\n");
}
