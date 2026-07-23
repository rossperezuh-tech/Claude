import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { DealsWidget, StageBoardWidget } from "@/components/DashWidgets";
import { DEAL_STAGE_LABELS, PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/constants";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-dynamic";
export const metadata = { title: "Real Estate — Venture HQ" };

// Tools surfaced at the top of the real estate focus view.
const FOCUS_TOOLS = ["deal-tracker", "follow-up", "outreach-writer"];

export default async function RealEstatePage() {
  const { orgId } = await requireOrg();
  const now = new Date();

  const [deals, pipeItems] = await Promise.all([
    prisma.deal.findMany({
      where: { business: { organizationId: orgId }, stage: { not: "CLOSE" } },
      orderBy: { targetClose: "asc" },
      include: { business: { select: { color: true } } },
    }),
    prisma.pipelineItem.findMany({
      where: { business: { organizationId: orgId } },
      select: { stage: true, valueCts: true },
    }),
  ]);

  const dealRows = deals.map((d) => ({
    id: d.id,
    name: d.name,
    stageLabel: DEAL_STAGE_LABELS[d.stage as keyof typeof DEAL_STAGE_LABELS] ?? d.stage,
    askingDollars: d.askingCts / 100,
    daysToClose: d.targetClose
      ? Math.ceil((d.targetClose.getTime() - now.getTime()) / 86_400_000)
      : null,
    businessColor: d.business.color,
  }));

  const pipelineStages = PIPELINE_STAGES.map((s) => {
    const inStage = pipeItems.filter((i) => i.stage === s);
    return {
      label: PIPELINE_STAGE_LABELS[s] ?? s,
      count: inStage.length,
      valueDollars: inStage.reduce((sum, i) => sum + i.valueCts, 0) / 100,
    };
  });

  const tools = FOCUS_TOOLS.map((slug) => TOOLS.find((t) => t.slug === slug)).filter(
    (t): t is (typeof TOOLS)[number] => !!t
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Real Estate</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Active deals and your acquisition pipeline, with closings that need attention first.
        </p>
      </div>

      {tools.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="card flex items-center gap-2 p-3 transition-colors hover:border-amber-400/40"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{
                  background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}14)`,
                  border: `1px solid ${t.accent}40`,
                }}
              >
                {t.icon}
              </span>
              <span className="text-sm font-medium leading-tight">{t.name}</span>
            </Link>
          ))}
        </div>
      )}

      <DealsWidget deals={dealRows} />
      <StageBoardWidget title="Acquisition pipeline" href="/tools/pipeline" stages={pipelineStages} />
    </div>
  );
}
