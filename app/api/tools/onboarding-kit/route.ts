import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are the Onboarding Kit inside Venture HQ. You produce a ready-to-send onboarding document for a new client or a new hire.

Guidelines:
- Output ONLY the kit in Markdown — no commentary.
- For a CLIENT: a warm welcome note, what happens next (kickoff, timeline), what you need from them (a checklist), how you'll communicate, and where to reach you.
- For a HIRE/TEAM MEMBER: a welcome note, first-day/first-week checklist, tools & access they'll need, who to ask for what, and expectations.
- Use clear checklists ("- [ ] ...") for anything the person must do or provide.
- Use ONLY the details given about the business and role. Where a specific detail is missing (a login, a meeting link, a start date), insert [FILL IN: ...] rather than inventing it.
- Keep it welcoming, concrete, and skimmable.`;

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { businessId?: string; who?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.context?.trim()) {
    return NextResponse.json({ error: "Describe who's being onboarded." }, { status: 400 });
  }
  const who = body.who === "hire" ? "a new hire / team member" : "a new client";

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
    content: `${businessContext}Onboarding: ${who}\n\nDetails (role, scope, what they need to know/do):\n${body.context.trim()}`,
    meta: { orgId, tool: "onboarding-kit" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
