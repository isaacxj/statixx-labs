import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser } from "@/server/user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <AppShell user={user}>{children}</AppShell>;
}
