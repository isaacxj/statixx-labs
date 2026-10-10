import { getCurrentUser } from "@/server/auth";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { CommandPalette } from "./command-palette";
import { listClients, listInvoices } from "@/server/db/queries";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [user, invoices, clients] = await Promise.all([getCurrentUser(), listInvoices(), listClients()]);
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar initials={user?.initials ?? "?"} email={user?.email ?? null} />
        <main className="animate-fade-in mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:px-6 md:pb-8">{children}</main>
      </div>
      <BottomNav />
      <CommandPalette
        invoices={invoices.slice(0, 100).map((i) => ({ id: i.id, label: `${i.number ?? "Draft"} · ${i.clientName}`, hint: i.businessName }))}
        clients={clients.map((c) => ({ id: c.id, label: c.name, hint: [c.company, c.email].filter(Boolean).join(" ") }))}
      />
    </div>
  );
}
