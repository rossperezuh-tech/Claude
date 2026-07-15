import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runText } from "@/lib/claude";

export const maxDuration = 300;

const PROPOSAL_PROMPT = `You are the proposal writer inside Venture HQ, drafting client proposals for a small-business operator.

Guidelines:
- Output ONLY the proposal in Markdown — no commentary before or after.
- Structure: title, a short personal opening addressed to the client, Understanding & Goals, Scope of Work (concrete deliverables as bullets), Timeline, Investment (use the given pricing; bracketed [TO DISCUSS] if none), Terms (payment schedule, revisions, validity window), Next Steps (how to accept).
- Write in the business's brand voice when provided — confident, specific, human. No corporate filler ("we are pleased to submit").
- Use ONLY facts, prices, and scope items provided. Bracketed placeholders like [START DATE] where a needed detail is missing. Never invent credentials or past results.
- Keep it tight: a page or two, not ten.`;

const INVOICE_PROMPT = `You are the invoice writer inside Venture HQ. You produce clean, professional invoices in Markdown.

Guidelines:
- Output ONLY the invoice in Markdown — no commentary.
- Structure: "# Invoice" header with invoice number and dates (issue date, due date), From block (the business), Bill To block (the client), a line-items table (Description | Amount) with a **Total** row, payment terms/instructions line, and a short thank-you.
- Use ONLY the line items, amounts, and details provided. [PAYMENT INSTRUCTIONS] placeholder if none given. Compute the total correctly from the line items.
- If a due date wasn't specified, use net-14 from the issue date.`;

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: {
    mode?: "proposal" | "invoice";
    businessId?: string;
    clientName?: string;
    details?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = body.mode === "invoice" ? "invoice" : "proposal";
  if (!body.clientName?.trim()) {
    return NextResponse.json({ error: "Who is this for? Add the client name." }, { status: 400 });
  }
  if (!body.details?.trim()) {
    return NextResponse.json(
      {
        error:
          mode === "invoice"
            ? "List what you're billing for (line items and amounts)."
            : "Describe the scope, pricing, and timeline to propose.",
      },
      { status: 400 },
    );
  }

  let businessContext = "";
  if (body.businessId) {
    const business = await prisma.business.findFirst({
      where: { id: body.businessId, organizationId: orgId },
      select: { name: true, description: true, brandVoice: true },
    });
    if (!business) return NextResponse.json({ error: "Unknown business." }, { status: 400 });
    businessContext = `From (the business): ${business.name} — ${business.description}\nBrand voice notes: ${business.brandVoice || "(none)"}\n`;
  }

  const today = new Date().toISOString().slice(0, 10);
  const invoiceNo = `INV-${today.slice(0, 7).replace("-", "")}-${String(
    Math.floor(1000 + Math.random() * 9000),
  )}`;

  const result = await runText({
    system: mode === "invoice" ? INVOICE_PROMPT : PROPOSAL_PROMPT,
    content: [
      `Today's date: ${today}`,
      mode === "invoice" ? `Invoice number: ${invoiceNo}` : "",
      businessContext,
      `Client: ${body.clientName.trim()}`,
      `${mode === "invoice" ? "Billing details" : "Engagement details"}:\n${body.details.trim()}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    meta: { orgId, tool: "proposals" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ draft: result.data });
}
