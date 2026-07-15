import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runStructured } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are Deal Analyzer, an acquisitions analyst inside Venture HQ, prepping a small direct-buyer for a commercial/residential real-estate deal.

Guidelines:
- Work ONLY from what's provided. Never invent comps, prices, cap rates, or property facts. Where a number matters and is missing, say what to find out instead.
- red_flags: anything in the notes that threatens value or closing — title issues, deferred maintenance, tenant problems, zoning, environmental, seller behavior.
- questions_for_seller: sharp, specific questions this listing/notes raise. The kind that change the offer.
- due_diligence: concrete checklist items with a priority (P1 = before any offer, P2 = before closing, P3 = nice to verify).
- offer_strategy: negotiation read — seller motivation signals, leverage points, structure ideas (as-is close, quick close, seller credit). If asking price and repair signals are present you may frame ranges relative to them ("10-15% below ask"), but never output a specific dollar figure that wasn't given.
- summary: 2-3 sentences: what the deal is and whether it smells worth pursuing.`;

const ANALYZER_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string" },
    red_flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low"] },
          description: { type: "string" },
        },
        required: ["severity", "description"],
        additionalProperties: false,
      },
    },
    questions_for_seller: { type: "array", items: { type: "string" } },
    due_diligence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short imperative checklist item" },
          details: { type: "string", description: "Why it matters; empty string if obvious" },
          priority: { type: "string", enum: ["P1", "P2", "P3"] },
        },
        required: ["title", "details", "priority"],
        additionalProperties: false,
      },
    },
    offer_strategy: { type: "string", description: "Negotiation read and structure ideas, plain prose" },
  },
  required: ["summary", "red_flags", "questions_for_seller", "due_diligence", "offer_strategy"],
  additionalProperties: false,
};

export interface DealAnalysis {
  summary: string;
  red_flags: { severity: string; description: string }[];
  questions_for_seller: string[];
  due_diligence: { title: string; details: string; priority: string }[];
  offer_strategy: string;
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { notes?: string; dealId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.notes?.trim()) {
    return NextResponse.json(
      { error: "Paste the listing, seller call notes, or property details first." },
      { status: 400 },
    );
  }

  // Optional: pull the tracked deal for context (org-verified).
  let dealContext = "";
  if (body.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: body.dealId, business: { organizationId: orgId } },
      select: {
        name: true, stage: true, address: true, askingCts: true,
        offerCts: true, targetClose: true, notes: true,
      },
    });
    if (deal) {
      dealContext = `Tracked deal context: ${JSON.stringify({
        name: deal.name,
        stage: deal.stage,
        address: deal.address || undefined,
        asking_usd: deal.askingCts > 0 ? deal.askingCts / 100 : undefined,
        our_offer_usd: deal.offerCts > 0 ? deal.offerCts / 100 : undefined,
        target_close: deal.targetClose?.toISOString().slice(0, 10),
        notes: deal.notes || undefined,
      })}\n\n`;
    }
  }

  const result = await runStructured<DealAnalysis>({
    system: SYSTEM_PROMPT,
    schema: ANALYZER_SCHEMA,
    content: `${dealContext}Listing / property notes:\n\n${body.notes.trim()}`,
    meta: { orgId, tool: "deal-analyzer" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ analysis: result.data });
}
