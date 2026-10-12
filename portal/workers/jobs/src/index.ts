import { EmailMessage } from "cloudflare:email";
import { buildDigest, sinceUtc } from "@/lib/digest";
import { buildDigestMime, parseRecipients } from "@/lib/digest-email";
import { todayInChicago } from "@/lib/milestones";
import { getDigestData } from "@/server/db/queries";

type JobsEnv = Cloudflare.Env & { DIGEST_EMAIL: SendEmail; DIGEST_FROM: string };

/** Emails the team the morning digest. Nothing is sent when there is nothing new. */
export async function sendDigest(env: JobsEnv, now: Date): Promise<{ sent: number; subject: string }> {
  const digest = buildDigest(await getDigestData(), sinceUtc(now), todayInChicago(now));
  if (digest.total === 0) return { sent: 0, subject: digest.subject };
  const recipients = parseRecipients(env.TEAM_EMAILS);
  for (const to of recipients) {
    const raw = buildDigestMime({ from: env.DIGEST_FROM, to, subject: digest.subject, text: digest.text, date: now, messageId: `${crypto.randomUUID()}@${env.DIGEST_FROM.split("@")[1] ?? "localhost"}` });
    await env.DIGEST_EMAIL.send(new EmailMessage(env.DIGEST_FROM, to, raw));
  }
  return { sent: recipients.length, subject: digest.subject };
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(sendDigest(env as JobsEnv, new Date()).then((r) => console.log(`digest: ${r.sent} sent · ${r.subject}`)));
  },
} satisfies ExportedHandler<Cloudflare.Env>;
