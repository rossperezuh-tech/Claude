import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runStructured } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are Launch Planner, an operations planner inside Venture HQ. You turn a described launch (product drop, service opening, campaign) into a concrete work-back plan a solo operator can execute.

Guidelines:
- Work backward from the launch date. Every task gets a realistic YYYY-MM-DD due date between today and shortly after launch (post-launch follow-ups are allowed within 2 weeks after).
- Tasks are concrete and imperative ("Order 200 boxes from supplier", not "Think about packaging"). Include quantities/specifics from the brief where given; do not invent prices or vendor names.
- Group tasks into 3-6 phases in execution order (e.g. Product & Ops, Content & Marketing, Sales & Distribution, Launch Week, Post-launch).
- priority: P1 = launch slips without it, P2 = important, P3 = polish.
- 15-30 tasks total for a typical launch — enough to be complete, not so many it's noise.
- watchouts: risks or commonly forgotten items for this specific kind of launch.`;

const PLAN_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string", description: "2-3 sentence read-back of the launch plan" },
    phases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Short imperative task title" },
                details: { type: "string", description: "Context or sub-steps; empty string if none" },
                due_date: { type: "string", description: "YYYY-MM-DD" },
                priority: { type: "string", enum: ["P1", "P2", "P3"] },
              },
              required: ["title", "details", "due_date", "priority"],
              additionalProperties: false,
            },
          },
        },
        required: ["name", "tasks"],
        additionalProperties: false,
      },
    },
    watchouts: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "phases", "watchouts"],
  additionalProperties: false,
};

export interface LaunchPlan {
  summary: string;
  phases: {
    name: string;
    tasks: { title: string; details: string; due_date: string; priority: string }[];
  }[];
  watchouts: string[];
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { businessId?: string; description?: string; launchDate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Describe the launch first." }, { status: 400 });
  }
  if (!body.launchDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.launchDate)) {
    return NextResponse.json({ error: "Pick a launch date." }, { status: 400 });
  }

  let businessContext = "";
  if (body.businessId) {
    const business = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: orgId },
      select: { name: true, description: true },
    });
    if (!business) return NextResponse.json({ error: "Unknown business." }, { status: 400 });
    businessContext = `Business: ${business.name} — ${business.description}\n`;
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = await runStructured<LaunchPlan>({
    system: SYSTEM_PROMPT,
    schema: PLAN_SCHEMA,
    content: `Today's date: ${today}\nLaunch date: ${body.launchDate}\n${businessContext}\nLaunch brief:\n${body.description.trim()}`,
    meta: { orgId, tool: "launch-planner" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ result: result.data });
}
