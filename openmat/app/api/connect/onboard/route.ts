import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Starts (or resumes) Stripe Connect Express onboarding for the logged-in
// coach or gym, then redirects them to Stripe's hosted onboarding flow.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in first" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments aren't configured yet (no Stripe key) — payouts stay manual for now." },
      { status: 400 }
    );
  }

  const profile = user.coachProfile ?? user.gymProfile;
  if (!profile) return NextResponse.json({ error: "No profile found" }, { status: 400 });

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin") || "http://localhost:3000";

  let accountId = profile.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: { transfers: { requested: true } },
      business_profile: {
        name: user.coachProfile ? user.coachProfile.displayName : user.gymProfile!.gymName,
        product_description: user.coachProfile
          ? "Combat sports coaching sessions"
          : "Gym space hosting for coaching sessions",
      },
      metadata: { openmatUserId: user.id },
    });
    accountId = account.id;

    if (user.coachProfile) {
      await prisma.coachProfile.update({
        where: { id: user.coachProfile.id },
        data: { stripeAccountId: accountId },
      });
    } else {
      await prisma.gymProfile.update({
        where: { id: user.gymProfile!.id },
        data: { stripeAccountId: accountId },
      });
    }
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${origin}/dashboard?connect=refresh`,
    return_url: `${origin}/dashboard?connect=done`,
  });

  return NextResponse.json({ url: link.url });
}
