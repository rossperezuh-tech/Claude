import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the signed-in user's Organization (the tenant all their data
 * lives under), creating it on first visit. Every page, server action, and
 * API route that touches the database must go through this and filter by
 * the returned orgId — nothing may query unscoped.
 */
export async function requireOrg(): Promise<{ orgId: string; userId: string }> {
  const { userId } = await auth();
  if (!userId) {
    // Middleware should make this unreachable; belt-and-suspenders.
    throw new Error("Not signed in.");
  }

  const existing = await prisma.organization.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (existing) return { orgId: existing.id, userId };

  const user = await currentUser();
  const name = user?.firstName ? `${user.firstName}'s HQ` : "My HQ";
  // upsert so two concurrent first requests can't create duplicate orgs
  const org = await prisma.organization.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId, name },
    select: { id: true },
  });
  return { orgId: org.id, userId };
}

/**
 * 404s a tool's page for orgs an admin has curated it out of. An empty
 * enabledTools list means "no restriction" — every tool is visible, which
 * is the default for every org until an admin explicitly narrows it down.
 * Call this from every tool page, right after requireOrg().
 */
export async function assertToolEnabled(orgId: string, slug: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { enabledTools: true },
  });
  if (!org) notFound();
  if (org.enabledTools.length > 0 && !org.enabledTools.includes(slug)) notFound();
}
