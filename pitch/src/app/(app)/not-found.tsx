import { StatePage } from "@/components/ui/state-page";

export default function AppNotFound() {
  return <StatePage title="Not found" body="That page doesn't exist, or it was deleted." action={{ label: "Back to dashboard", href: "/" }} />;
}
