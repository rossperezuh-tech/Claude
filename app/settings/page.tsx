import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import BrandingForm from "@/components/BrandingForm";

export const metadata = { title: "Settings — Venture HQ" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { orgId } = await requireOrg();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { brandName: true, brandColor: true, brandLogoUrl: true },
  });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <div className="text-xs text-ink-faint">
          <Link href="/" className="hover:text-ink-dim">Home</Link> / Settings
        </div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Branding</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Put your own name, color, and logo in the top bar. This is what you (or your client) see
          across the whole account.
        </p>
      </div>
      <BrandingForm
        brandName={org?.brandName ?? ""}
        brandColor={org?.brandColor ?? ""}
        brandLogoUrl={org?.brandLogoUrl ?? null}
      />
    </div>
  );
}
