/** Comma-separated TEAM_EMAILS to a clean, lower-cased, de-duplicated list. */
export function parseRecipients(raw: string | undefined): string[] {
  return [...new Set((raw ?? "").split(",").map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@")))];
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** A plain-text RFC 5322 message (UTF-8, base64 body) for one recipient. Header values may not contain line breaks. */
export function buildDigestMime(opts: { from: string; to: string; subject: string; text: string; date: Date; messageId: string }): string {
  const clean = (v: string) => v.replace(/[\r\n]+/g, " ").trim();
  const body = (base64Utf8(opts.text).match(/.{1,76}/g) ?? []).join("\r\n");
  return [
    `From: Portal <${clean(opts.from)}>`,
    `To: ${clean(opts.to)}`,
    `Subject: =?UTF-8?B?${base64Utf8(clean(opts.subject))}?=`,
    `Date: ${opts.date.toUTCString()}`,
    `Message-ID: <${clean(opts.messageId)}>`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    body,
    "",
  ].join("\r\n");
}
