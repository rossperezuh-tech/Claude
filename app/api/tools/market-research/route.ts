import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are the Market & Competitor Research tool inside Venture HQ. You use live web search to answer the user's market, competitor, or industry question, then write a concise briefing.

Guidelines:
- Search the web for current, specific information before answering. Prefer recent sources.
- Output Markdown. Structure: **Snapshot** (2-3 sentence answer), **Key findings** (bullets, each with the concrete fact), **Competitors / players** (if relevant), **Opportunities & risks**, **Sources** (list the links you used).
- Be concrete and cite what you found. If the web results are thin or conflicting, say so rather than guessing.
- Keep it tight and useful for a busy operator making a decision.`;

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { businessId?: string; query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.query?.trim()) {
    return NextResponse.json({ error: "Enter what you want researched." }, { status: 400 });
  }

  let businessContext = "";
  if (body.businessId) {
    const business = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: orgId },
      select: { name: true, description: true },
    });
    if (business) businessContext = `Context — my business: ${business.name} — ${business.description}\n\n`;
  }

  const result = await runText({
    system: SYSTEM_PROMPT,
    content: `${businessContext}Research request:\n${body.query.trim()}`,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
    meta: { orgId, tool: "market-research" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
