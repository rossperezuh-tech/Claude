import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { missingKeyResponse, runStructured } from "@/lib/claude";

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

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;

  let body: AnalyzeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ask = {
    type: "text" as const,
    text: `Analyze this document${body.filename ? ` (${body.filename})` : ""}.`,
  };
  let content: Anthropic.ContentBlockParam[];
  if (body.kind === "pdf") {
    if (!body.base64) {
      return NextResponse.json({ error: "No PDF data provided." }, { status: 400 });
    }
    if (body.base64.length * 0.75 > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "PDF is too large (32 MB max)." }, { status: 400 });
    }
    content = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: body.base64 },
      },
      ask,
    ];
  } else {
    if (!body.text?.trim()) {
      return NextResponse.json({ error: "No document text provided." }, { status: 400 });
    }
    content = [
      { type: "document", source: { type: "text", media_type: "text/plain", data: body.text } },
      ask,
    ];
  }

  const result = await runStructured({ system: SYSTEM_PROMPT, schema: ANALYSIS_SCHEMA, content });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ analysis: result.data });
}
