import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";
import { initialsFromEmail } from "@/lib/user";
import { getCurrentUser } from "@/server/user";

export const metadata: Metadata = { title: { default: "Tempo", template: "%s · Tempo" } };

// Sets the theme class before first paint so there is no flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem("tempo-theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <AppShell initials={initialsFromEmail(user.email)} email={user.email}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
