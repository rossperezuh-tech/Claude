import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are Client Report inside Venture HQ. You write the outward-facing monthly/period report an agency or service business sends its client — the "here's what we did for you" document.

Guidelines:
- Output ONLY the report in Markdown — no commentary.
- Structure: # title (period + client), a 2-3 sentence executive summary, What we delivered (from completed work), Content published/scheduled (if any, grouped by platform), In progress & coming next, and a short closing note inviting questions.
- Voice: professional, warm, confident — the business's brand voice when provided.
- Use ONLY the activity data provided. Do NOT invent metrics, results, impressions, or ROI numbers. If the operator added context notes, weave them in.
- Frame everything client-benefit-first ("12 reels produced to keep your feed daily-active" not "we did 12 tasks").`;

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { businessId?: string; clientName?: string; extra?: string; days?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.businessId) {
    return NextResponse.json({ error: "Pick a business." }, { status: 400 });
  }

  const business = await prisma.business.findFirst({
    where: { id: body.businessId, organizationId: orgId },
    select: { id: true, name: true, description: true, brandVoice: true },
  });
  if (!business) return NextResponse.json({ error: "Unknown business." }, { status: 400 });

  const days = Math.min(Math.max(Number(body.days) || 30, 7), 92);
  const since = new Date(Date.now() - days * 86_400_000);

  const [done, inProgress, posts, pipeline] = await Promise.all([
    prisma.task.findMany({
      where: { businessId: business.id, status: "DONE", completedAt: { gte: since } },
      select: { title: true, notes: true, completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 100,
    }),
    prisma.task.findMany({
      where: { businessId: business.id, status: { in: ["IN_PROGRESS", "THIS_WEEK"] } },
      select: { title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.contentPost.findMany({
      where: {
        businessId: business.id,
        OR: [
          { status: "POSTED", updatedAt: { gte: since } },
          { status: "SCHEDULED" },
        ],
      },
      select: { title: true, platform: true, status: true, scheduledFor: true },
      take: 100,
    }),
    prisma.pipelineItem.findMany({
      where: {
        businessId: business.id,
        ...(body.clientName?.trim()
          ? { name: { contains: body.clientName.trim(), mode: "insensitive" } }
          : {}),
      },
      select: { name: true, kind: true, stage: true, notes: true },
      take: 20,
    }),
  ]);

  const d = (x: Date | null) => x?.toISOString().slice(0, 10) ?? null;
  const activity = {
    period_days: days,
    business: { name: business.name, description: business.description },
    completed_work: done.map((t) => ({ title: t.title, notes: t.notes || undefined, on: d(t.completedAt) })),
    in_progress: inProgress.map((t) => ({ title: t.title, due: d(t.dueDate) })),
    content: posts.map((p) => ({
      title: p.title, platform: p.platform, status: p.status, scheduled_for: d(p.scheduledFor),
    })),
    engagements: pipeline.map((i) => ({ name: i.name, kind: i.kind, stage: i.stage })),
  };

  const result = await runText({
    system: SYSTEM_PROMPT,
    content: [
      `Today's date: ${new Date().toISOString().slice(0, 10)}`,
      body.clientName?.trim() ? `Report is FOR client: ${body.clientName.trim()}` : "Report covers all client work in the period.",
      `Brand voice notes: ${business.brandVoice || "(none)"}`,
      body.extra?.trim() ? `Operator context to include: ${body.extra.trim()}` : "",
      `Activity data:\n${JSON.stringify(activity, null, 1)}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    meta: { orgId, tool: "client-report" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
