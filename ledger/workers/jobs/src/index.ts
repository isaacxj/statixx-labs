import { sendDigest, type DigestEnv } from "./digest";
import { runJobs } from "./jobs";

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      (async () => {
        const { today } = await runJobs(env.DB);
        // Last, so the digest sees the invoices the jobs just created or marked overdue.
        try {
          const sent = await sendDigest(env, today);
          console.log(sent ? `digest sent for ${today}` : "digest skipped: no recipient or email binding");
        } catch (err) {
          console.error("digest failed", err);
        }
      })(),
    );
  },
} satisfies ExportedHandler<DigestEnv>;
