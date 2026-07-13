import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300;

const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

const SYSTEM_PROMPT = `You are Document Reader, a document-analysis assistant for a small-business operator. You read contracts, briefs, agreements, and other business documents and produce a plain-English breakdown.

Guidelines:
- Write for a smart non-lawyer. Plain English, no legalese in your explanations.
- Quote the document exactly in "quote" fields (trim to the load-bearing sentence or two).
- Mark importance "high" for anything involving money, liability, termination, exclusivity, IP ownership, auto-renewal, or personal guarantees.
- Dates: extract every concrete date or deadline, including relative ones (e.g. "30 days after signing" — state it as written).
- Risks: things that could cost the reader money or leverage. Be direct about what's one-sided.
- unusual_or_missing: clauses you'd expect in this document type that aren't there, or terms that deviate from standard practice.
- You assist review; you are not a substitute for a licensed attorney.`;

const ANALYSIS_SCHEMA = {
  type: "object" as const,
  properties: {
    document_type: { type: "string", description: "e.g. 'Commercial lease', 'NDA', 'Service agreement'" },
    parties: { type: "array", items: { type: "string" }, description: "Named parties and their roles" },
    summary: { type: "string", description: "3-6 sentence plain-English summary of what this document does" },
    key_clauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          importance: { type: "string", enum: ["high", "medium", "low"] },
          quote: { type: "string", description: "Exact text from the document" },
          explanation: { type: "string", description: "What it means in plain English" },
        },
        required: ["title", "importance", "quote", "explanation"],
        additionalProperties: false,
      },
    },
    key_dates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string", description: "The date or deadline as written" },
          description: { type: "string" },
        },
        required: ["date", "description"],
        additionalProperties: false,
      },
    },
    risks: {
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
    unusual_or_missing: { type: "array", items: { type: "string" } },
  },
  required: ["document_type", "parties", "summary", "key_clauses", "key_dates", "risks", "unusual_or_missing"],
  additionalProperties: false,
};

type AnalyzeBody =
  | { kind: "text"; text: string; filename?: string }
  | { kind: "pdf"; base64: string; filename?: string };

function userContent(body: AnalyzeBody): Anthropic.ContentBlockParam[] {
  const ask = {
    type: "text" as const,
    text: `Analyze this document${body.filename ? ` (${body.filename})` : ""}.`,
  };
  if (body.kind === "pdf") {
    return [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: body.base64 },
      },
      ask,
    ];
  }
  return [
    { type: "document", source: { type: "text", media_type: "text/plain", data: body.text } },
    ask,
  ];
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env and restart the dev server." },
      { status: 500 },
    );
  }

  let body: AnalyzeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.kind === "text" && !body.text?.trim()) {
    return NextResponse.json({ error: "No document text provided." }, { status: 400 });
  }
  if (body.kind === "pdf") {
    if (!body.base64) {
      return NextResponse.json({ error: "No PDF data provided." }, { status: 400 });
    }
    if (body.base64.length * 0.75 > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "PDF is too large (32 MB max)." }, { status: 400 });
    }
  }

  const client = new Anthropic();

  try {
    const response = await client.messages
      .stream({
        model: "claude-opus-4-8",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        output_config: { format: { type: "json_schema", schema: ANALYSIS_SCHEMA } },
        messages: [{ role: "user", content: userContent(body) }],
      })
      .finalMessage();

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The model declined to analyze this document." },
        { status: 422 },
      );
    }
    if (response.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "The document is too long for a single analysis. Try a shorter excerpt." },
        { status: 422 },
      );
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json({ error: "The model returned no analysis." }, { status: 502 });
    }

    return NextResponse.json({ analysis: JSON.parse(textBlock.text) });
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
