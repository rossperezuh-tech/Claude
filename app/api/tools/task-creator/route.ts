import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runStructured } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You turn pasted text — a plan, an email, a brief, meeting notes, a brain-dump — into a clean list of actionable tasks.

Guidelines:
- Each task is ONE concrete action, phrased starting with a verb ("Email the supplier", "Draft the launch post").
- Extract a due date ONLY when the text implies one. Resolve relative dates ("Friday", "next week", "by the 15th", "tomorrow") to an absolute YYYY-MM-DD using the provided today's date. If no date is implied, use an empty string.
- Put any useful specifics in a short note; otherwise leave notes empty.
- Do NOT invent tasks the text doesn't imply. Split multi-part items into separate tasks. Skip vague fluff.`;

const SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          dueDate: { type: "string", description: "YYYY-MM-DD, or empty string if none" },
          notes: { type: "string" },
        },
        required: ["title", "dueDate", "notes"],
        additionalProperties: false,
      },
    },
  },
  required: ["tasks"],
  additionalProperties: false,
} as const;

interface Extracted {
  tasks: { title: string; dueDate: string; notes: string }[];
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { businessId?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "Paste something to turn into tasks." }, { status: 400 });
  }

  if (body.businessId) {
    const owned = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: orgId },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: "Unknown business." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = await runStructured<Extracted>({
    system: SYSTEM_PROMPT,
    schema: SCHEMA,
    content: `Today's date is ${today}.\n\nText to turn into tasks:\n\n${body.text.trim()}`,
    meta: { orgId, tool: "task-creator" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ tasks: result.data.tasks });
}
