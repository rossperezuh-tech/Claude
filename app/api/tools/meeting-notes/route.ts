import { NextRequest, NextResponse } from "next/server";
import { missingKeyResponse, runStructured } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are Meeting Notes, an assistant that turns raw meeting notes, call transcripts, or deposition notes into a clean, actionable breakdown for a small-business operator.

Guidelines:
- Action items: concrete next steps only. Each title is short and imperative ("Send revised lease to Anna"), with any useful detail in "details".
- Owner: the person responsible, exactly as named in the notes; empty string if unassigned.
- due_date: resolve explicit or relative dates ("by Friday", "end of month") to a YYYY-MM-DD date using the meeting date provided; empty string if no date was implied. Put the original wording in due_hint.
- priority: P1 = urgent/blocking or money at stake, P2 = normal, P3 = nice-to-have.
- Decisions: things that were settled, not discussed. Open questions: unresolved items needing follow-up.
- Do not invent action items that are not supported by the notes.`;

const NOTES_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string", description: "2-4 sentence summary of the meeting" },
    decisions: { type: "array", items: { type: "string" } },
    action_items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short imperative task title" },
          details: { type: "string", description: "Context or sub-steps; empty string if none" },
          owner: { type: "string", description: "Person responsible; empty string if unassigned" },
          due_date: { type: "string", description: "YYYY-MM-DD, or empty string if no date implied" },
          due_hint: { type: "string", description: "Original date wording from the notes; empty string if none" },
          priority: { type: "string", enum: ["P1", "P2", "P3"] },
        },
        required: ["title", "details", "owner", "due_date", "due_hint", "priority"],
        additionalProperties: false,
      },
    },
    open_questions: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "decisions", "action_items", "open_questions"],
  additionalProperties: false,
};

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;

  let body: { notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.notes?.trim()) {
    return NextResponse.json({ error: "No notes provided." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = await runStructured({
    system: SYSTEM_PROMPT,
    schema: NOTES_SCHEMA,
    content: `Today's date: ${today}\n\nMeeting notes:\n\n${body.notes}`,
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ result: result.data });
}
