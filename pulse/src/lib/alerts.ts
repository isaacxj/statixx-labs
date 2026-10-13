export type AlertKind = "down" | "recovered";

export type AlertIncident = {
  title: string;
  monitorName: string;
  url: string;
  startedAt: string;
  resolvedAt: string | null;
};

export function isValidEmail(value: string): boolean {
  return /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value);
}

export function parseRecipient(raw: string): { ok: true; email: string } | { ok: false; error: string } {
  const email = raw.trim().toLowerCase();
  if (!email) return { ok: false, error: "Enter an email address." };
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email address." };
  return { ok: true, email };
}

const stamp = (utc: string) => `${utc} UTC`;

export function alertContent(kind: AlertKind, i: AlertIncident): { subject: string; text: string } {
  if (kind === "down") {
    return {
      subject: `[Down] ${i.monitorName}`,
      text: `${i.title}\n\nMonitor: ${i.monitorName}\nURL: ${i.url}\nDown since: ${stamp(i.startedAt)}\n\nTwo checks in a row failed. You'll get one more email when it recovers.\n`,
    };
  }
  return {
    subject: `[Recovered] ${i.monitorName}`,
    text: `${i.monitorName} is back up.\n\nURL: ${i.url}\nDown since: ${stamp(i.startedAt)}\nRecovered: ${stamp(i.resolvedAt ?? i.startedAt)}\n`,
  };
}

// Plain-text RFC 5322 message for Email Routing's send_email binding.
export function rawEmail(from: string, to: string, subject: string, text: string, messageId: string, date: Date): string {
  return [
    `From: Pulse <${from}>`,
    `To: ${to}`,
    `Subject: ${subject.replace(/[\r\n]+/g, " ")}`,
    `Message-ID: <${messageId}>`,
    `Date: ${date.toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "",
    text.replace(/\r?\n/g, "\r\n"),
  ].join("\r\n");
}
