import { StatePage } from "@/components/ui/state-page";

export default function NotFound() {
  return (
    <main className="p-4">
      <StatePage title="Link not found" body="This link doesn't exist or is no longer available. Ask the sender for a new one." />
    </main>
  );
}
