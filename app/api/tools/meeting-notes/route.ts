import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env and restart the dev server." },
      { status: 500 },
    );
  }

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
  const client = new Anthropic();

  try {
    const response = await client.messages
      .stream({
        model: "claude-opus-4-8",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        output_config: { format: { type: "json_schema", schema: NOTES_SCHEMA } },
        messages: [
          {
            role: "user",
            content: `Today's date: ${today}\n\nMeeting notes:\n\n${body.notes}`,
          },
        ],
      })
      .finalMessage();

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The model declined to process these notes." },
        { status: 422 },
      );
    }
    if (response.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "The notes are too long for a single pass. Try splitting them." },
        { status: 422 },
      );
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json({ error: "The model returned no result." }, { status: 502 });
    }

    return NextResponse.json({ result: JSON.parse(textBlock.text) });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Invalid ANTHROPIC_API_KEY." }, { status: 500 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited by the Claude API. Wait a minute and retry." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return NextResponse.json(
        { error: "Could not reach the Claude API. Check your network." },
        { status: 502 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude API error: ${error.message}` }, { status: 502 });
    }
    throw error;
  }
}
