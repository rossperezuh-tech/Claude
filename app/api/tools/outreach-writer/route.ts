import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are the Outreach Writer inside Venture HQ. You write outbound messages — cold intros, follow-ups, pitches, and re-engagement notes — that get replies.

Guidelines:
- Output ONLY the message(s) in Markdown — no preamble or commentary.
- Match the requested type. For a "sequence", write 3 messages labeled "Email 1 — day 0", "Email 2 — day 3", "Email 3 — day 7", each shorter than the last.
- Keep it short, human, and specific. Lead with the recipient's world, not the sender's. One clear call to action.
- Give each email a subject line ("**Subject:** …") and a body.
- Use the sender's brand voice when provided. Use ONLY facts given; where a specific detail is missing, use [FILL IN: ...] instead of inventing it.
- No spammy hype, no fake urgency, no "I hope this email finds you well."`;

const TYPES: Record<string, string> = {
  cold: "Cold intro — first contact, no prior relationship",
  followup: "Follow-up — nudging a conversation that went quiet",
  pitch: "Pitch — proposing specific work or a deal",
  reengage: "Re-engagement — reviving a past client or lead",
  sequence: "A 3-email follow-up sequence",
};

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { businessId?: string; type?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.context?.trim()) {
    return NextResponse.json({ error: "Describe who you're writing to and why." }, { status: 400 });
  }
  const typeLabel = TYPES[body.type ?? "cold"] ?? TYPES.cold;

  let brandContext = "";
  if (body.businessId) {
    const business = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: orgId },
      select: { name: true, description: true, brandVoice: true },
    });
    if (!business) return NextResponse.json({ error: "Unknown business." }, { status: 400 });
    brandContext = `Sender business: ${business.name} — ${business.description}\n${
      business.brandVoice ? `Brand voice: ${business.brandVoice}\n` : ""
    }\n`;
  }

  const result = await runText({
    system: SYSTEM_PROMPT,
    content: `${brandContext}Message type: ${typeLabel}\n\nWho you're writing to and what you want:\n${body.context.trim()}`,
    meta: { orgId, tool: "outreach-writer" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
