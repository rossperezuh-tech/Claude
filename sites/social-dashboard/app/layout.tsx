import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export const metadata: Metadata = {
  title: {
    default: "Social Dashboard",
    template: "%s · Social Dashboard",
  },
  description:
    "Client, contract, invoice, content calendar, and performance command center for a social media management business.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
          <Sidebar />
          <main className="min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
