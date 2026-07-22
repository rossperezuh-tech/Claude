import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { DASHBOARD_TEMPLATES } from "@/lib/dashboards";
import DashboardChooser from "@/components/DashboardChooser";

export const metadata = { title: "Welcome — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const { orgId } = await requireOrg();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { onboardedAt: true, dashboardTemplate: true },
  });
  // Already onboarded — no need to see this again.
  if (org?.onboardedAt) redirect("/");

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      <div className="relative overflow-hidden rounded-xl border border-surface-edge bg-surface-raised p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to your command center 👋</h1>
          <p className="mt-1 text-sm text-ink-dim">
            First, let's set your home dashboard to match your business. Pick the one that fits — you
            can change it any time from the dropdown on your dashboard.
          </p>
        </div>
      </div>

      <DashboardChooser
        current={org?.dashboardTemplate ?? "command-center"}
        templates={DASHBOARD_TEMPLATES.map((t) => ({ id: t.id, name: t.name, blurb: t.blurb }))}
        onboarding
      />
    </div>
  );
}
