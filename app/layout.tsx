import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { isPlatformAdmin } from "@/lib/admin";
import CommandPalette from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "Venture HQ",
  description: "Multi-business command center",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const showAdminLink = userId ? await isPlatformAdmin() : false;

  let businesses: { id: string; name: string; slug: string; color: string }[] = [];
  if (userId) {
    const { orgId } = await requireOrg();
    businesses = await prisma.business.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, color: true },
    });
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-surface-edge bg-surface/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-400" />
                Venture HQ
              </Link>
              {userId && (
                <nav className="flex items-center gap-1 text-sm text-ink-dim">
                  <Link href="/" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
                    Home
                  </Link>
                  <Link href="/tasks" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
                    Tasks
                  </Link>
                  <Link href="/docs" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
                    Docs
                  </Link>
                  <Link href="/tools" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
                    Tools
                  </Link>
                  <Link href="/billing" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
                    Billing
                  </Link>
                  {showAdminLink && (
                    <Link href="/admin" className="rounded px-2 py-1 hover:bg-surface-overlay hover:text-ink">
                      Admin
                    </Link>
                  )}
                </nav>
              )}
              <div className="ml-auto flex items-center gap-3">
                {userId && (
                  <div className="hidden text-xs text-ink-faint sm:block">
                    <kbd className="rounded border border-surface-edge bg-surface-overlay px-1.5 py-0.5">
                      ⌘K
                    </kbd>{" "}
                    search
                  </div>
                )}
                <UserButton />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-5">{children}</main>
          {userId && <CommandPalette businesses={businesses} />}
        </body>
      </html>
    </ClerkProvider>
  );
}
