import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Ledger" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans text-sm antialiased">{children}</body>
    </html>
  );
}
