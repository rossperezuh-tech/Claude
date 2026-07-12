import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { PLATFORM } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: `${PLATFORM.name} — ${PLATFORM.tagline}`,
  description: PLATFORM.description,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-600 text-sm">
                OM
              </span>
              {PLATFORM.name}
            </Link>
            <nav className="flex items-center gap-3 text-sm sm:gap-5">
              <Link href="/coaches" className="text-zinc-400 hover:text-white">
                Coaches
              </Link>
              <Link href="/gyms" className="text-zinc-400 hover:text-white">
                Gyms
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500"
                  >
                    Dashboard
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-zinc-400 hover:text-white">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500"
                  >
                    Join
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
          <p className="font-semibold text-zinc-400">{PLATFORM.name}</p>
          <p className="mt-1">{PLATFORM.tagline}</p>
        </footer>
      </body>
    </html>
  );
}
