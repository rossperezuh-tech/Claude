import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are SOP Writer inside Venture HQ. You turn a business owner's description of how something gets done into a standard operating procedure a new hire could follow without asking questions.

Guidelines:
- Output ONLY the SOP in Markdown — no commentary.
- Structure: # title, Purpose (1-2 sentences), Owner & when it runs, Before you start (tools/access/materials as a checklist), numbered Steps with concrete sub-bullets, Quality check (how you know it was done right), Common mistakes.
- Every step is an action a person can take. Split anything vague into observable steps.
- Use ONLY what the owner described. Where a critical detail is missing (a password location, a supplier name), insert [FILL IN: ...] rather than inventing it.
- Match the business's context when given; keep the writing plain and direct.`;

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { businessId?: string; process?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.process?.trim()) {
    return NextResponse.json({ error: "Describe the process first." }, { status: 400 });
  }

  let businessContext = "";
  if (body.businessId) {
    const business = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: orgId },
      select: { name: true, description: true },
    });
    if (!business) return NextResponse.json({ error: "Unknown business." }, { status: 400 });
    businessContext = `Business: ${business.name} — ${business.description}\n\n`;
  }

  const result = await runText({
    system: SYSTEM_PROMPT,
    content: `${businessContext}How it gets done today (owner's description):\n\n${body.process.trim()}`,
    meta: { orgId, tool: "sop-writer" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
