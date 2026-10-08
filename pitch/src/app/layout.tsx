import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitch",
  description: "Proposals and quotes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
