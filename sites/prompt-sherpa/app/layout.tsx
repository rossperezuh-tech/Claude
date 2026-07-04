import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";

export const viewport: Viewport = {
  themeColor: "#F5F7F2",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "The Prompt Sherpa — Claude Code Builds & Claude Consulting",
    template: "%s · The Prompt Sherpa",
  },
  description:
    "Claude consulting & Claude Code builds for early-stage entrepreneurs. MVPs, landing pages, and prototypes — the fastest path from idea to something real.",
  keywords: [
    "Claude consulting",
    "Claude Code",
    "Claude Code builds",
    "MVP development",
    "startup prototype",
    "landing page builder",
    "idea to product",
  ],
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: "The Prompt Sherpa",
    title: "The Prompt Sherpa — Claude Code Builds & Claude Consulting",
    description:
      "Claude consulting & Claude Code builds for early-stage entrepreneurs. MVPs, landing pages, and prototypes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Prompt Sherpa — Claude Code Builds & Claude Consulting",
    description:
      "Claude consulting & Claude Code builds for early-stage entrepreneurs.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
