import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deckroom — private DJ practice rooms, NYC",
  description:
    "Book a private, sound-treated room with an AlphaTheta DJ-RX3 and tuned monitors. Greenpoint and Manhattan. By the hour, no membership.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
