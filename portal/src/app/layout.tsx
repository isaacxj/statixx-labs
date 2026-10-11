import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Portal", description: "A private portal for each client's projects, files, and approvals." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
