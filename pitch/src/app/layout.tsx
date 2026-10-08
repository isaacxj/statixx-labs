import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser } from "@/server/user";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitch",
  description: "Proposals and quotes",
};

const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
