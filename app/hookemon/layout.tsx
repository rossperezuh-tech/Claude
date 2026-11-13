import type { Metadata } from "next";
import Link from "next/link";
import { isInstructor } from "@/lib/hookemon/auth";

export const metadata: Metadata = {
  title: "Hookemon University",
  description: "Gear training and certification",
};

export const dynamic = "force-dynamic";

export default function HookemonLayout({ children }: { children: React.ReactNode }) {
  const instructor = isInstructor();
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-surface-edge bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
          <Link href={instructor ? "/hookemon" : "/hookemon/survey"} className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
            Hookemon<span className="hidden sm:inline"> University</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm text-ink-dim">
            {instructor && (
              <Link href="/hookemon" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
                Roster
              </Link>
            )}
            <Link href="/hookemon/gear" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
              Gear
            </Link>
            <Link href="/hookemon/survey" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
              Survey
            </Link>
          </nav>
          {instructor && (
            <Link href="/" className="ml-auto hidden text-xs text-ink-faint hover:text-ink sm:block">
              ← Venture HQ
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </>
  );
}
