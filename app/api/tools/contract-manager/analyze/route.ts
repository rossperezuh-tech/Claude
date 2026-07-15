import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runStructured } from "@/lib/claude";

export const maxDuration = 300;

const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

const SYSTEM_PROMPT = `You are The Contract Manager, an assistant that reads a contract and extracts the tracking data a small-business operator needs: what the agreement is, who it's with, when it runs, and — most importantly — the renewal mechanics.

Guidelines:
- Dates: output YYYY-MM-DD. If a date is relative ("30 days after signing") and cannot be resolved from the document, leave the date field as an empty string and explain in date_notes.
- auto_renews is true only if the contract renews automatically absent notice.
- renewal_notice_date: the LAST day to send a non-renewal/termination notice before auto-renewal locks in (end date minus the notice period). Compute it when both pieces are present; empty string otherwise.
- key_dates: every other concrete deadline worth tracking (payment escalations, option exercise windows, delivery milestones).
- summary: 2-3 plain-English sentences on what this contract commits the reader to.
- You assist review; you are not a substitute for a licensed attorney.`;

const CONTRACT_SCHEMA = {
  type: "object" as const,
  properties: {
    title: { type: "string", description: "Short name, e.g. 'Office lease — 231 Norman Ave'" },
    counterparty: { type: "string", description: "The other party's name; empty if unclear" },
    effective_date: { type: "string", description: "YYYY-MM-DD or empty string" },
    end_date: { type: "string", description: "YYYY-MM-DD or empty string" },
    auto_renews: { type: "boolean" },
    renewal_notice_date: { type: "string", description: "YYYY-MM-DD or empty string" },
    renewal_terms: {
      type: "string",
      description: "Plain-English description of the renewal/termination mechanics; empty if none",
    },
    date_notes: {
      type: "string",
      description: "Caveats about unresolved or relative dates; empty if none",
    },
    summary: { type: "string" },
    key_dates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD or the wording as written" },
          description: { type: "string" },
        },
        required: ["date", "description"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "title",
    "counterparty",
    "effective_date",
    "end_date",
    "auto_renews",
    "renewal_notice_date",
    "renewal_terms",
    "date_notes",
    "summary",
    "key_dates",
  ],
  additionalProperties: false,
};

type AnalyzeBody =
  | { kind: "text"; text: string; filename?: string }
  | { kind: "pdf"; base64: string; filename?: string };

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: AnalyzeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let content: Anthropic.ContentBlockParam[];
  const today = new Date().toISOString().slice(0, 10);
  const ask = {
    type: "text" as const,
    text: `Today's date: ${today}. Extract the tracking data from this contract${
      body.filename ? ` (${body.filename})` : ""
    }.`,
  };
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
      return NextResponse.json({ error: "No contract text provided." }, { status: 400 });
    }
    content = [
      { type: "document", source: { type: "text", media_type: "text/plain", data: body.text } },
      ask,
    ];
  }

  const result = await runStructured({
    system: SYSTEM_PROMPT,
    schema: CONTRACT_SCHEMA,
    content,
    meta: { orgId, tool: "contract-manager" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ analysis: result.data });
}
