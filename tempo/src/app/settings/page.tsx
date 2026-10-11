import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { listBusinesses } from "@/server/db/queries";
import { saveRounding } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const businesses = await listBusinesses();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Rounding rounds a timer up to the next increment when you stop it. Manual entries and the timesheet are never rounded. New
          entries are billable unless the project is non-billable.
        </p>
      </header>
      {businesses.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-card border p-6">No businesses yet.</p>
      ) : (
        <ul className="bg-card rounded-card divide-border divide-y border">
          {businesses.map((b) => (
            <li key={b.id} className="px-4 py-3">
              <form action={saveRounding.bind(null, b.id)} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="font-medium sm:flex-1">{b.name}</span>
                <Label htmlFor={`rounding-${b.id}`} className="text-muted-foreground">
                  Timer rounding
                </Label>
                <Select id={`rounding-${b.id}`} name="rounding" defaultValue={b.roundingMinutes} className="sm:w-48">
                  <option value={0}>None</option>
                  <option value={6}>Up to 6 minutes</option>
                  <option value={15}>Up to 15 minutes</option>
                </Select>
                <Button type="submit" variant="outline" size="sm">
                  Save
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
