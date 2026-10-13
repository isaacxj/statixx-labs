import { AppShell } from "@/components/shell/app-shell";
import { AddRecipientForm, RecipientList } from "@/components/recipients";
import { listAlertRecipients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const recipients = await listAlertRecipients();
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
    </AppShell>
  );
}
