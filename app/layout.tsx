import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venture HQ",
  description: "Multi-business command center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
