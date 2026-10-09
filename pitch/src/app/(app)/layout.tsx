import { AppShell } from "@/components/shell/app-shell";
import { listPaletteData } from "@/server/db/queries";
import { getCurrentUser } from "@/server/user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, palette] = await Promise.all([getCurrentUser(), listPaletteData()]);
  return <AppShell user={user} palette={palette}>{children}</AppShell>;
}
