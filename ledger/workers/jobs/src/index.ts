import { runJobs } from "./jobs";

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(runJobs(env.DB));
  },
} satisfies ExportedHandler<{ DB: D1Database }>;
