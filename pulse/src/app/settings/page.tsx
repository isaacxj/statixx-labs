import { RAW_RETENTION_DAYS, ROLLUP_RETENTION_DAYS } from "@/lib/retention";
import { AppShell } from "@/components/shell/app-shell";
import { AddRecipientForm, RecipientList } from "@/components/recipients";
import { getRetentionStats, listAlertRecipients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [recipients, stats] = await Promise.all([listAlertRecipients(), getRetentionStats()]);
  return (
    <AppShell title="Settings">
      <section aria-labelledby="alerts-heading" className="flex max-w-2xl flex-col gap-4">
        <div>
          <h2 id="alerts-heading" className="text-xl font-semibold">Alert recipients</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Everyone here gets one email when a monitor is confirmed down and one when it recovers.
          </p>
        </div>
        <AddRecipientForm />
        <RecipientList recipients={recipients} />
      </section>
      <section aria-labelledby="retention-heading" className="mt-10 flex max-w-2xl flex-col gap-4">
        <div>
          <h2 id="retention-heading" className="text-xl font-semibold">Data retention</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Every completed hour is summarized into one rollup per monitor. Raw checks are kept {RAW_RETENTION_DAYS} days and
            rollups {ROLLUP_RETENTION_DAYS} days.
          </p>
        </div>
        <dl className="bg-card grid grid-cols-2 gap-4 rounded-lg border p-4">
          <Stat label="Raw checks" value={stats.rawChecks} since={stats.oldestRaw} />
          <Stat label="Hourly rollups" value={stats.rollups} since={stats.oldestRollup} />
        </dl>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, since }: { label: string; value: number; since: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-mono text-2xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</dd>
      <dd className="text-muted-foreground font-mono text-xs tabular-nums">{since ? `since ${since} UTC` : "none yet"}</dd>
    </div>
  );
}
