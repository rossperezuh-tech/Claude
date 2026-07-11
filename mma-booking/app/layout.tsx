import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} — Book Muay Thai Classes`,
  description: SITE.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-red-600 text-sm font-black">
                MT
              </span>
              <span className="hidden sm:inline">{SITE.name}</span>
              <span className="sm:hidden">{SITE.shortName}</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/#schedule" className="text-zinc-400 hover:text-white">
                Schedule
              </Link>
              <Link href="/#classes" className="text-zinc-400 hover:text-white">
                Classes
              </Link>
              <Link
                href="/book"
                className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
              >
                Book a Class
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
          <p className="font-medium text-zinc-400">{SITE.name}</p>
          <p>
            {SITE.address} · {SITE.city}
          </p>
          <p className="mt-1">
            {SITE.phone} · {SITE.email}
          </p>
        </footer>
      </body>
    </html>
  );
}
