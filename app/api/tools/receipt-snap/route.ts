import { NextRequest, NextResponse } from "next/server";
import { requireOrg } from "@/lib/org";
import { missingKeyResponse, runStructured } from "@/lib/claude";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You read a photo of a receipt or invoice and extract the money details for a bookkeeping log. Return the total amount actually paid (not subtotal), the vendor/merchant, and the date. Treat receipts as EXPENSE unless it's clearly income. If a field isn't legible, use your best reading and keep memo short.`;

const SCHEMA = {
  type: "object",
  properties: {
    vendor: { type: "string", description: "Merchant / vendor name" },
    amountDollars: { type: "number", description: "Total paid, in dollars" },
    date: { type: "string", description: "Date on the receipt, YYYY-MM-DD; empty if unreadable" },
    type: { type: "string", enum: ["EXPENSE", "REVENUE"] },
    memo: { type: "string", description: "Short note: vendor + what it was for" },
  },
  required: ["vendor", "amountDollars", "date", "type", "memo"],
  additionalProperties: false,
} as const;

interface Receipt {
  vendor: string;
  amountDollars: number;
  date: string;
  type: string;
  memo: string;
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;
  const { orgId } = await requireOrg();

  let body: { image?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.image) {
    return NextResponse.json({ error: "Attach a receipt photo first." }, { status: 400 });
  }

  const media = (body.mediaType ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const result = await runStructured<Receipt>({
    system: SYSTEM_PROMPT,
    schema: SCHEMA,
    content: [
      { type: "image", source: { type: "base64", media_type: media, data: body.image } },
      { type: "text", text: "Extract the receipt details." },
    ],
    meta: { orgId, tool: "receipt-snap" },
  });
  if ("errorResponse" in result) return result.errorResponse;
  return NextResponse.json({ receipt: result.data });
}
