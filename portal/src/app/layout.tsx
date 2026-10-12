import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { brandVars } from "@/lib/branding";
import { getClientBrandingForUser } from "@/server/db/queries";
import { getCurrentUser, getViewer } from "@/server/viewer";
import "./globals.css";

export const metadata: Metadata = { title: "Portal", description: "A private portal for each client's projects, files, and approvals." };

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const user = viewer.variant === "client" ? await getCurrentUser() : null;
  const client = user?.kind === "client" ? await getClientBrandingForUser(user, user.clientId) : null;
  const brand = client ? { name: client.name, style: brandVars(client.accent), logoUrl: client.logoKey ? `/logo/${client.id}` : null } : undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppShell variant={viewer.variant} title="Portal" initials={viewer.initials} brand={brand}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
