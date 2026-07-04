import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Steadyhand — Claude Consulting for Small Business",
    template: "%s · Steadyhand",
  },
  description:
    "Independent Claude consulting for established small businesses. Claude AI workflow optimization and private, local LLM setup — measured in hours saved, not hype.",
  keywords: [
    "Claude consulting",
    "Claude AI consultant",
    "AI workflow optimization",
    "local LLM setup",
    "private AI for small business",
    "small business AI consulting",
  ],
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: "Steadyhand",
    title: "Steadyhand — Claude Consulting for Small Business",
    description:
      "Independent Claude consulting for established small businesses. Claude AI workflow optimization and private, local LLM setup.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Steadyhand — Claude Consulting for Small Business",
    description:
      "Independent Claude consulting for established small businesses.",
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
