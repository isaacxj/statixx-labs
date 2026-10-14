import { EmailMessage } from "cloudflare:email";
import { DIGEST_SETTING, buildMime, digestSubject, digestText } from "../../../src/lib/digest";
import { digestSince, loadDigestData } from "../../../src/lib/digest-data";

export type DigestEnv = { DB: D1Database; EMAIL?: SendEmail; DIGEST_FROM?: string };

/** Emails the morning digest to the recipient in Settings. Returns the plain text sent, or null if nothing was sent. */
export async function sendDigest(env: DigestEnv, today: string, now = new Date()): Promise<string | null> {
  const to = (await env.DB.prepare("SELECT value FROM settings WHERE key = ?1").bind(DIGEST_SETTING).first<{ value: string }>())?.value;
  if (!to || !env.EMAIL || !env.DIGEST_FROM) return null;
  const data = await loadDigestData(env.DB, today, digestSince(now));
  const text = digestText(data, today);
  const raw = buildMime({
    from: env.DIGEST_FROM,
    to,
    subject: digestSubject(data, today),
    text,
    messageId: `${crypto.randomUUID()}@${env.DIGEST_FROM.split("@")[1]}`,
  });
  await env.EMAIL.send(new EmailMessage(env.DIGEST_FROM, to, raw));
  return text;
}
