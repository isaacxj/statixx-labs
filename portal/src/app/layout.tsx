import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { getViewer } from "@/server/viewer";
import "./globals.css";

export const metadata: Metadata = { title: "Portal", description: "A private portal for each client's projects, files, and approvals." };

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppShell variant={viewer.variant} title="Portal" initials={viewer.initials}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
