import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are the Follow-Up Assistant inside Venture HQ. You look at the user's active clients/leads (pipeline) and real-estate deals that haven't moved recently, and help them chase what matters.

Guidelines:
- Output Markdown. Order by who's most worth following up now (higher value + longer gone quiet + earlier stage that needs a push).
- For each, a short heading with the name, business, stage, value, and days since last touch, then a **2-3 sentence follow-up message** they can send, in a warm, natural voice.
- Only use the records provided. Where contact info or a specific detail is missing, write [FILL IN: ...].
- If nothing looks stale, say so plainly and note the healthiest active items.
- Keep it tight — this is a to-do list of nudges, not an essay.`;

function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}
function fmt(cents: number): string {
  return cents ? `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "no value set";
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  const [pipeline, deals] = await Promise.all([
    prisma.pipelineItem.findMany({
      where: { business: { organizationId: orgId }, stage: { not: "DONE" } },
      orderBy: { updatedAt: "asc" },
      include: { business: { select: { name: true } } },
    }),
    prisma.deal.findMany({
      where: { business: { organizationId: orgId }, stage: { not: "CLOSE" } },
      orderBy: { updatedAt: "asc" },
      include: { business: { select: { name: true } } },
    }),
  ]);

  if (pipeline.length === 0 && deals.length === 0) {
    return NextResponse.json({
      draft: "No active clients, leads, or deals to follow up on yet. Add some in the Client & Order Tracker or Deal Tracker and I'll help you chase them.",
    });
  }

  const pipeLines = pipeline.map(
    (p) =>
      `- [Client/Order] ${p.name} — ${p.business.name}, stage ${p.stage}, value ${fmt(
        p.valueCts,
      )}, contact: ${p.contact || "unknown"}, ${daysSince(p.updatedAt)}d since last update. Notes: ${
        p.notes || "none"
      }`,
  );
  const dealLines = deals.map(
    (d) =>
      `- [Deal] ${d.name} — ${d.business.name}, stage ${d.stage}, asking ${fmt(
        d.askingCts,
      )}, offer ${fmt(d.offerCts)}, contact: ${d.contact || "unknown"}, ${daysSince(
        d.updatedAt,
      )}d since last update. Notes: ${d.notes || "none"}`,
  );

  const result = await runText({
    system: SYSTEM_PROMPT,
    content: `Active items to review for follow-up:\n${[...pipeLines, ...dealLines].join(
      "\n",
    )}\n\nPrioritize and draft the nudges.`,
    meta: { orgId, tool: "follow-up" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
