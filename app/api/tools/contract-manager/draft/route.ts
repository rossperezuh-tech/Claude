import { NextRequest, NextResponse } from "next/server";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are The Contract Manager's drafting assistant. You draft clear, professional business agreements in Markdown for a small-business operator.

Guidelines:
- Output ONLY the agreement itself in Markdown — no preamble, no commentary before or after.
- Use a conventional structure: title, parties block, recitals if useful, numbered sections, signature block.
- Plain, modern legal English. No archaic boilerplate ("WITNESSETH", "hereinbefore").
- Where a business detail was not provided, insert a bracketed placeholder like [PAYMENT AMOUNT] rather than inventing terms.
- Include sensible protective basics for the drafting party (governing law, notices, termination) even if not requested.
- End with a bracketed note: "[Draft prepared with AI assistance — have an attorney review before signing.]"`;

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;

  let body: { agreementType?: string; parties?: string; terms?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.agreementType?.trim() || !body.terms?.trim()) {
    return NextResponse.json(
      { error: "Provide at least the agreement type and the key terms." },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const brief = [
    `Today's date: ${today}`,
    `Agreement type: ${body.agreementType.trim()}`,
    body.parties?.trim() && `Parties: ${body.parties.trim()}`,
    `Key terms and context:\n${body.terms.trim()}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await runText({ system: SYSTEM_PROMPT, content: brief });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
