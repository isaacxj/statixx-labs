import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme")||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export const metadata: Metadata = { title: "Pulse", description: "Uptime monitoring and client status pages" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
