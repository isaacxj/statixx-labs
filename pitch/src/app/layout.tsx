import type { Metadata } from "next";
import { collapseScript } from "@/components/shell/collapse-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitch",
  description: "Proposals and quotes",
};

const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript + collapseScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
