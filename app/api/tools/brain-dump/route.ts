import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runStructured } from "@/lib/claude";
import { CONTENT_PLATFORMS } from "@/lib/constants";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are Brain Dump, the capture-and-route assistant inside Venture HQ. The operator pastes unstructured thoughts — end-of-day notes, a voice-memo transcript, a walk-and-talk ramble — and you sort every actionable piece into the right bucket for the right business.

Guidelines:
- You get the operator's business list (slug, name, description). Route each item to the most plausible business_slug; use the closest match when the reference is loose ("the yoga place"). If truly none fits, put it in unrouted.
- tasks: anything to do. Short imperative titles; capture context in details. Resolve relative dates ("by Friday") to YYYY-MM-DD using today's date; empty string if none. P1 only when the text signals urgency or money at stake.
- content_ideas: post/video/story ideas. Pick the platform if stated, default instagram.
- leads: people/companies to sell to, or inbound interest. kind "order" for product purchases, else "client".
- money: actual money in/out that happened ("sold 3 boxes", "paid the printer $200"). REVENUE or EXPENSE, positive dollars. NOT projections or hopes.
- Split compound thoughts into separate items. Do not invent anything not in the text. Every extracted item must trace to something the operator actually wrote.
- unrouted: fragments that matter but fit nowhere — keep them short.`;

const DUMP_SCHEMA = {
  type: "object" as const,
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          business_slug: { type: "string" },
          title: { type: "string" },
          details: { type: "string", description: "Empty string if none" },
          due_date: { type: "string", description: "YYYY-MM-DD or empty string" },
          priority: { type: "string", enum: ["P1", "P2", "P3"] },
        },
        required: ["business_slug", "title", "details", "due_date", "priority"],
        additionalProperties: false,
      },
    },
    content_ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          business_slug: { type: "string" },
          title: { type: "string" },
          platform: { type: "string", enum: [...CONTENT_PLATFORMS] },
        },
        required: ["business_slug", "title", "platform"],
        additionalProperties: false,
      },
    },
    leads: {
      type: "array",
      items: {
        type: "object",
        properties: {
          business_slug: { type: "string" },
          name: { type: "string" },
          kind: { type: "string", enum: ["client", "order"] },
          value_dollars: { type: "number", description: "0 if unknown" },
          contact: { type: "string", description: "Empty string if none" },
          notes: { type: "string", description: "Empty string if none" },
        },
        required: ["business_slug", "name", "kind", "value_dollars", "contact", "notes"],
        additionalProperties: false,
      },
    },
    money: {
      type: "array",
      items: {
        type: "object",
        properties: {
          business_slug: { type: "string" },
          type: { type: "string", enum: ["REVENUE", "EXPENSE"] },
          amount_dollars: { type: "number" },
          memo: { type: "string" },
        },
        required: ["business_slug", "type", "amount_dollars", "memo"],
        additionalProperties: false,
      },
    },
    unrouted: { type: "array", items: { type: "string" } },
  },
  required: ["tasks", "content_ideas", "leads", "money", "unrouted"],
  additionalProperties: false,
};

export interface BrainDumpResult {
  tasks: { business_slug: string; title: string; details: string; due_date: string; priority: string }[];
  content_ideas: { business_slug: string; title: string; platform: string }[];
  leads: { business_slug: string; name: string; kind: string; value_dollars: number; contact: string; notes: string }[];
  money: { business_slug: string; type: string; amount_dollars: number; memo: string }[];
  unrouted: string[];
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "Paste something to sort first." }, { status: 400 });
  }

  const businesses = await prisma.business.findMany({
    where: { organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, description: true },
  });
  if (businesses.length === 0) {
    return NextResponse.json({ error: "Create a business first." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = await runStructured<BrainDumpResult>({
    system: SYSTEM_PROMPT,
    schema: DUMP_SCHEMA,
    content: `Today's date: ${today}\n\nBusinesses:\n${businesses
      .map((b) => `- ${b.slug}: ${b.name} — ${b.description}`)
      .join("\n")}\n\nBrain dump:\n\n${body.text.trim()}`,
    meta: { orgId, tool: "brain-dump" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ result: result.data });
}
