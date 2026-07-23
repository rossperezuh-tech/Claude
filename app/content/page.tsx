import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { ContentWeekWidget, ContentPipelineWidget } from "@/components/DashWidgets";
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS } from "@/lib/constants";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content — Venture HQ" };

// Tools surfaced at the top of the content focus view.
const FOCUS_TOOLS = ["content-studio", "content-calendar", "brain-dump", "the-brain"];

export default async function ContentPage() {
  const { orgId } = await requireOrg();
  const now = new Date();

  const [posts, businessCount] = await Promise.all([
    prisma.contentPost.findMany({
      where: { business: { organizationId: orgId } },
      include: { business: { select: { color: true, name: true } } },
    }),
    prisma.business.count({ where: { organizationId: orgId } }),
  ]);

  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const postRows = posts
    .filter((p) => p.scheduledFor && p.scheduledFor >= startOfDay(now) && p.scheduledFor <= weekEnd)
    .sort((a, b) => a.scheduledFor!.getTime() - b.scheduledFor!.getTime())
    .map((p) => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      dateText: format(p.scheduledFor!, "EEE d"),
      color: p.business.color,
      // Show the client/brand name only when managing several.
      client: businessCount > 1 ? p.business.name : undefined,
    }));

  const contentCounts = CONTENT_STATUSES.map((s) => ({
    label: CONTENT_STATUS_LABELS[s] ?? s,
    count: posts.filter((p) => p.status === s).length,
  }));

  const tools = FOCUS_TOOLS.map((slug) => TOOLS.find((t) => t.slug === slug)).filter(
    (t): t is (typeof TOOLS)[number] => !!t
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Content</h1>
        <p className="mt-1 text-sm text-ink-dim">
          What&apos;s going out this week and everything in the pipeline, across all your brands.
        </p>
      </div>

      {tools.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

      <ContentWeekWidget posts={postRows} />
      <ContentPipelineWidget counts={contentCounts} />
    </div>
  );
}
