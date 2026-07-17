import { auth } from "@clerk/nextjs/server";

/**
 * Platform-admin check — true only for the single Clerk user named by
 * ADMIN_CLERK_USER_ID. Distinct from org ownership: an admin can manage
 * settings (tool access, billing view) across every org, not just their own.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const { userId } = await auth();
  return !!userId && !!process.env.ADMIN_CLERK_USER_ID && userId === process.env.ADMIN_CLERK_USER_ID;
}
