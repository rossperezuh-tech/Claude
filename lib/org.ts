import { auth, currentUser } from "@clerk/nextjs/server";
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
